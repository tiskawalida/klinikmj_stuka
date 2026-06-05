import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'], autoConnect: true });
    const socket = socketRef.current;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('low-stock-alert', (data) => {
      setNotifications(prev => [{ ...data, id: Date.now(), read: false }, ...prev.slice(0, 49)]);
    });
    socket.on('expiry-alert', (data) => {
      setNotifications(prev => [{ ...data, id: Date.now(), read: false }, ...prev.slice(0, 49)]);
    });
    socket.on('new-transaction', (data) => {
      setNotifications(prev => [{ type: 'info', message: `Transaksi baru: ${data.invoiceNumber}`, id: Date.now(), read: false }, ...prev.slice(0, 49)]);
    });

    return () => socket.disconnect();
  }, []);

  const joinUserRoom = (userId) => socketRef.current?.emit('join-user-room', userId);
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, notifications, joinUserRoom, markAllRead, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
