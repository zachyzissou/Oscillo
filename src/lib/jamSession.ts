import { create } from 'zustand'
import Peer from 'simple-peer'
import { logger } from './logger'
import { nanoid } from 'nanoid'

interface JamState {
  id: string | null;
  peers: Record<string, any>;
  start: () => void;
  send: (data: any) => void;
}

export const useJam = create<JamState>((set, get) => ({
  id: null,
  peers: {},
  start: () => {
    const id = nanoid(6);
    const serverUrl = (() => {
      if (typeof window === 'undefined') {
        return 'ws://localhost:3030';
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      return `${protocol}//${host}:3030`;
    })();
    const socket = new WebSocket(serverUrl);
    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          type: 'join',
          id,
        })
      );
    });
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data as string);
      if (data.type === 'signal' && data.from) {
        let peer = get().peers[data.from];
        if (!peer) {
          peer = new Peer({ initiator: false, trickle: false });
          peer.on('signal', (s: any) => {
            socket.send(JSON.stringify({ type: 'signal', id, to: data.from, payload: s }));
          });
          peer.on('data', (d: Uint8Array) => logger.info('peer data: ' + d.toString()));
          set({ peers: { ...get().peers, [data.from]: peer } });
        }
        peer.signal(data.payload);
      } else if (data.type === 'signal-ready' && data.from) {
        const peer = new Peer({ initiator: true, trickle: false });
        peer.on('signal', (s: any) => {
          socket.send(JSON.stringify({ type: 'signal', id, to: data.from, payload: s }));
        });
        peer.on('data', (d: Uint8Array) => logger.info('peer data: ' + d.toString()));
        set({ peers: { ...get().peers, [data.from]: peer } });
        peer.signal(data.payload);
      }
    });
    set({ id });
  },
  send: (data: any) => {
    Object.values(get().peers).forEach(p => p.send(JSON.stringify(data)));
  },
}));
