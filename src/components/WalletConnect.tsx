import { useWalletState } from '../hooks/useWalletState';
import { User } from 'lucide-react';

export const WalletConnect = () => {
  const { isConnected, walletAddress, connect, disconnect } = useWalletState();

  if (isConnected && walletAddress) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-2 rounded-md font-medium transition-all duration-300"
      >
        <User size={18} />
        <span className="truncate max-w-[100px]">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-4 py-2 rounded-md font-medium transition-all duration-300"
    >
      <User size={18} />
      <span>Connect Wallet</span>
    </button>
  );
}; 