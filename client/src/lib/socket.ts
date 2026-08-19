import { getToken } from "./auth";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL, {
            auth: { token: getToken() },
            autoConnect: false,
        });
    }
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) {
        s.auth = { token: getToken() };
        s.connect();
    }
    return s;
}

export function disconnectSocket() {
    if (socket?.connected) socket.disconnect();
}