import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWalletConnection } from './useWalletConnection';
import { connectWallet, disconnectWallet } from '../store/slices/userSlice';
import { RootState } from '../store';

export const useWalletState = () => {
  const dispatch = useDispatch();
  const { isConnected, walletAddress, connect, disconnect } = useWalletConnection();
  const { isConnected: reduxIsConnected, walletAddress: reduxWalletAddress } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (isConnected && walletAddress) {
      if (!reduxIsConnected || reduxWalletAddress !== walletAddress) {
        console.log('Dispatching connectWallet to Redux', { walletAddress });
        dispatch(connectWallet({
          address: walletAddress,
          username: `Player${Math.floor(Math.random() * 1000)}`
        }));
      }
    } else if (reduxIsConnected) {
      console.log('Dispatching disconnectWallet to Redux');
      dispatch(disconnectWallet());
    }
  }, [isConnected, walletAddress, dispatch, reduxIsConnected, reduxWalletAddress]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error initiating wallet connection:', error);
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error initiating wallet disconnection:', error);
    }
  }, [disconnect]);

  return {
    isConnected: reduxIsConnected,
    walletAddress: reduxWalletAddress,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
}; 