import { useSuiClient, useWallets, useConnectWallet, useDisconnectWallet, useCurrentWallet } from '@mysten/dapp-kit';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { connectWallet, disconnectWallet } from '../store/slices/userSlice';

export const useWalletConnection = () => {
  const dispatch = useDispatch();
  const client = useSuiClient();
  const wallets = useWallets();
  const { mutate: connectToWallet } = useConnectWallet();
  const { mutate: disconnectFromWallet } = useDisconnectWallet();
  const { currentWallet, connectionStatus } = useCurrentWallet();

  // Effect to update Redux store when wallet connection status changes via the hook
  useEffect(() => {
    // Check if connected based on connectionStatus
    const isConnected = connectionStatus === 'connected';

    if (isConnected && currentWallet?.accounts[0]?.address) {
      // Dispatch Redux action to update user state
      dispatch(connectWallet({
        address: currentWallet.accounts[0].address,
        username: `Player${Math.floor(Math.random() * 1000)}` // Placeholder username
      }));
    } else if (!isConnected) { // Dispatch disconnect when not connected
      // Dispatch Redux action to reset user state on disconnection or if connection fails
      dispatch(disconnectWallet());
    }
    // Dependencies include connectionStatus and currentWallet as they are the state from the hook
  }, [connectionStatus, currentWallet, dispatch]);

  const connect = useCallback(async () => {
    if (!wallets || wallets.length === 0) {
      console.error('No wallets available');
      throw new Error('No wallets available');
    }

    // Attempt to connect to the first available wallet. In a real app,
    // you'd likely prompt the user to choose.
    const targetWallet = wallets[0];
    connectToWallet({ wallet: targetWallet });

    // Note: The actual state update (connected, currentWallet) happens
    // asynchronously within dapp-kit. The useEffect above will catch the change.

    // We don't return address/balance here directly as they come from the
    // asynchronous state update caught by the effect. Callers should rely on
    // the Redux state (via useWalletState hook) for connection info.

  }, [wallets, connectToWallet]); // Dependencies for useCallback

  const disconnect = useCallback(async () => {
    // Trigger disconnection using the mutate function from useDisconnectWallet
    disconnectFromWallet();
    // Note: State update is asynchronous and caught by the useEffect
  }, [disconnectFromWallet]); // Dependencies for useCallback

  const getBalance = useCallback(async () => {
     if (!client || !currentWallet?.accounts[0]?.address) {
      console.error('Client or wallet not available to get balance.');
      throw new Error('Client or wallet not connected.');
     }
    try {
      const address = currentWallet.accounts[0].address;
      const balance = await client.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      return balance.totalBalance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }, [client, currentWallet]); // Dependencies for useCallback

  const mintNFT = useCallback(async (gameMode: string) => {
    if (!client || !currentWallet?.accounts[0]?.address) {
       console.error('Client or wallet not available to mint NFT.');
       throw new Error('Client or wallet not connected for minting.');
    }
    try {
      const address = currentWallet.accounts[0].address;
      // This is a placeholder. Actual NFT minting would involve:
      // 1. Creating a Move transaction (potentially using client or currentWallet methods)
      // 2. Signing and executing it with the wallet (using currentWallet methods, e.g., signAndExecuteTransactionBlock)
      console.log(`Attempting to mint NFT for ${address} in ${gameMode} mode`);
      // Example placeholder for successful transaction response structure
      return {
        success: true,
        transactionId: 'placeholder-tx-id',
      };
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      throw error;
    }
  }, [client, currentWallet]); // Dependencies for useCallback

  return {
    // Derive isConnected from connectionStatus
    isConnected: connectionStatus === 'connected', 
    walletAddress: currentWallet?.accounts[0]?.address || null, // Expose connected address from useCurrentWallet
    connect,
    disconnect,
    getBalance,
    mintNFT,
  };
}; 