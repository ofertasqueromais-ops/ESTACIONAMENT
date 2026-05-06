import { useState, useEffect } from 'react';
import { bluetoothPrinter } from '@/lib/bluetoothPrinter';

export function useBluetoothPrinter() {
  const [isConnected, setIsConnected] = useState(bluetoothPrinter.isConnected());

  useEffect(() => {
    const unsubscribe = bluetoothPrinter.subscribe(setIsConnected);
    return () => unsubscribe();
  }, []);

  return { isConnected, bluetoothPrinter };
}
