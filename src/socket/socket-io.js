
function socket(io) {
  io.on('connection', (socket) => {
    socket.on('createRoom', async ({ room_id }, callback) => {
      socket.room_id = room_id;

      if (roomList.has(socket.room_id)) {
        callback({ error: 'already exists' });
      } else {
        log.debug('Created room', { room_id: socket.room_id });
        let worker = await getMediasoupWorker();
        roomList.set(socket.room_id, new Room(socket.room_id, worker, io));
        callback({ room_id: socket.room_id });
      }
    });

    socket.on('getPeerCounts', async ({ }, callback) => {
      if (!roomList.has(socket.room_id)) return;

      let peerCounts = roomList.get(socket.room_id).getPeersCount();

      log.debug('Peer counts', { peerCounts: peerCounts });

      callback({ peerCounts: peerCounts });
    });

    socket.on('cmd', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Cmd', data);

      // cmd|foo|bar|....
      const words = data.split('|');
      let cmd = words[0];
      switch (cmd) {
        case 'privacy':
          roomList
            .get(socket.room_id)
            .getPeers()
            .get(socket.id)
            .updatePeerInfo({ type: cmd, status: words[2] == 'true' });
          break;
        //...
      }

      roomList.get(socket.room_id).broadCast(socket.id, 'cmd', data);
    });

    socket.on('roomAction', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Room action:', data);
      switch (data.action) {
        case 'lock':
          if (!roomList.get(socket.room_id).isLocked()) {
            roomList.get(socket.room_id).setLocked(true, data.password);
            roomList.get(socket.room_id).broadCast(socket.id, 'roomAction', data.action);
          }
          break;
        case 'checkPassword':
          let roomData = {
            room: null,
            password: 'KO',
          };
          if (data.password == roomList.get(socket.room_id).getPassword()) {
            roomData.room = roomList.get(socket.room_id).toJson();
            roomData.password = 'OK';
          }
          roomList.get(socket.room_id).sendTo(socket.id, 'roomPassword', roomData);
          break;
        case 'unlock':
          roomList.get(socket.room_id).setLocked(false);
          roomList.get(socket.room_id).broadCast(socket.id, 'roomAction', data.action);
          break;
        case 'lobbyOn':
          roomList.get(socket.room_id).setLobbyEnabled(true);
          roomList.get(socket.room_id).broadCast(socket.id, 'roomAction', data.action);
          break;
        case 'lobbyOff':
          roomList.get(socket.room_id).setLobbyEnabled(false);
          roomList.get(socket.room_id).broadCast(socket.id, 'roomAction', data.action);
          break;
      }
      log.debug('Room status', {
        locked: roomList.get(socket.room_id).isLocked(),
        lobby: roomList.get(socket.room_id).isLobbyEnabled(),
      });
    });

    socket.on('roomLobby', (data) => {
      if (!roomList.has(socket.room_id)) return;

      data.room = roomList.get(socket.room_id).toJson();

      log.debug('Room lobby', {
        peer_id: data.peer_id,
        peer_name: data.peer_name,
        peers_id: data.peers_id,
        lobby: data.lobby_status,
        broadcast: data.broadcast,
      });

      if (data.peers_id && data.broadcast) {
        for (let peer_id in data.peers_id) {
          roomList.get(socket.room_id).sendTo(data.peers_id[peer_id], 'roomLobby', data);
        }
      } else {
        roomList.get(socket.room_id).sendTo(data.peer_id, 'roomLobby', data);
      }
    });

    socket.on('peerAction', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Peer action', data);

      if (data.broadcast) {
        roomList.get(socket.room_id).broadCast(data.peer_id, 'peerAction', data);
      } else {
        roomList.get(socket.room_id).sendTo(data.peer_id, 'peerAction', data);
      }
    });

    socket.on('updatePeerInfo', (data) => {
      if (!roomList.has(socket.room_id)) return;

      // update my peer_info status to all in the room
      roomList.get(socket.room_id).getPeers().get(socket.id).updatePeerInfo(data);
      roomList.get(socket.room_id).broadCast(socket.id, 'updatePeerInfo', data);
    });

    socket.on('fileInfo', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Send File Info', data);
      if (data.broadcast) {
        roomList.get(socket.room_id).broadCast(socket.id, 'fileInfo', data);
      } else {
        roomList.get(socket.room_id).sendTo(data.peer_id, 'fileInfo', data);
      }
    });

    socket.on('file', (data) => {
      if (!roomList.has(socket.room_id)) return;

      if (data.broadcast) {
        roomList.get(socket.room_id).broadCast(socket.id, 'file', data);
      } else {
        roomList.get(socket.room_id).sendTo(data.peer_id, 'file', data);
      }
    });

    socket.on('fileAbort', (data) => {
      if (!roomList.has(socket.room_id)) return;

      roomList.get(socket.room_id).broadCast(socket.id, 'fileAbort', data);
    });

    socket.on('shareVideoAction', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Share video: ', data);
      if (data.peer_id == 'all') {
        roomList.get(socket.room_id).broadCast(socket.id, 'shareVideoAction', data);
      } else {
        roomList.get(socket.room_id).sendTo(data.peer_id, 'shareVideoAction', data);
      }
    });

    socket.on('wbCanvasToJson', (data) => {
      if (!roomList.has(socket.room_id)) return;
      roomList.get(socket.room_id).broadCast(socket.id, 'wbCanvasToJson', data);
    });

    socket.on('whiteboardAction', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Whiteboard', data);
      roomList.get(socket.room_id).broadCast(socket.id, 'whiteboardAction', data);
    });

    socket.on('setVideoOff', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Video off', getPeerName());
      roomList.get(socket.room_id).broadCast(socket.id, 'setVideoOff', data);
    });

    socket.on('join', (data, cb) => {
      if (!roomList.has(socket.room_id)) {
        return cb({
          error: 'Room does not exist',
        });
      }

      log.debug('User joined', data);
      roomList.get(socket.room_id).addPeer(new Peer(socket.id, data));

      if (roomList.get(socket.room_id).isLocked()) {
        log.debug('User rejected because room is locked');
        return cb('isLocked');
      }

      if (roomList.get(socket.room_id).isLobbyEnabled()) {
        log.debug('User waiting to join room because lobby is enabled');
        roomList.get(socket.room_id).broadCast(socket.id, 'roomLobby', {
          peer_id: data.peer_info.peer_id,
          peer_name: data.peer_info.peer_name,
          lobby_status: 'waiting',
        });
        return cb('isLobby');
      }

      cb(roomList.get(socket.room_id).toJson());
    });

    socket.on('getRouterRtpCapabilities', (_, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({ error: 'Room not found' });
      }

      log.debug('Get RouterRtpCapabilities', getPeerName());
      try {
        callback(roomList.get(socket.room_id).getRtpCapabilities());
      } catch (err) {
        callback({
          error: err.message,
        });
      }
    });

    socket.on('getProducers', () => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Get producers', getPeerName());

      // send all the current producer to newly joined member
      let producerList = roomList.get(socket.room_id).getProducerListForPeer();

      socket.emit('newProducers', producerList);
    });

    socket.on('createWebRtcTransport', async (_, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({ error: 'Room not found' });
      }

      log.debug('Create webrtc transport', getPeerName());
      try {
        const { params } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id);
        callback(params);
      } catch (err) {
        log.error('Create WebRtc Transport error: ', err.message);
        callback({
          error: err.message,
        });
      }
    });

    socket.on('connectTransport', async ({ transport_id, dtlsParameters }, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({ error: 'Room not found' });
      }

      log.debug('Connect transport', getPeerName());

      await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters);

      callback('success');
    });

    socket.on('produce', async ({ producerTransportId, kind, appData, rtpParameters }, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({ error: 'Room not found' });
      }

      let peer_name = getPeerName(false);

      // peer_info audio Or video ON
      let data = {
        peer_name: peer_name,
        peer_id: socket.id,
        kind: kind,
        type: appData.mediaType,
        status: true,
      };
      await roomList.get(socket.room_id).getPeers().get(socket.id).updatePeerInfo(data);

      let producer_id = await roomList
        .get(socket.room_id)
        .produce(socket.id, producerTransportId, rtpParameters, kind, appData.mediaType);

      log.debug('Produce', {
        kind: kind,
        type: appData.mediaType,
        peer_name: peer_name,
        peer_id: socket.id,
        producer_id: producer_id,
      });

      // add & monitor producer audio level
      if (kind === 'audio') {
        roomList.get(socket.room_id).addProducerToAudioLevelObserver({ producerId: producer_id });
      }

      callback({
        producer_id,
      });
    });

    socket.on('consume', async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({ error: 'Room not found' });
      }

      let params = await roomList
        .get(socket.room_id)
        .consume(socket.id, consumerTransportId, producerId, rtpCapabilities);

      log.debug('Consuming', {
        peer_name: getPeerName(false),
        producer_id: producerId,
        consumer_id: params ? params.id : undefined,
      });

      callback(params);
    });

    socket.on('producerClosed', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Producer close', data);

      // peer_info audio Or video OFF
      roomList.get(socket.room_id).getPeers().get(socket.id).updatePeerInfo(data);
      roomList.get(socket.room_id).closeProducer(socket.id, data.producer_id);
    });

    socket.on('resume', async (_, callback) => {
      await consumer.resume();
      callback();
    });

    socket.on('getRoomInfo', (_, cb) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Send Room Info to', getPeerName());
      cb(roomList.get(socket.room_id).toJson());
    });

    socket.on('refreshParticipantsCount', () => {
      if (!roomList.has(socket.room_id)) return;

      let data = {
        room_id: socket.room_id,
        peer_counts: roomList.get(socket.room_id).getPeers().size,
      };
      log.debug('Refresh Participants count', data);
      roomList.get(socket.room_id).broadCast(socket.id, 'refreshParticipantsCount', data);
    });

    socket.on('message', (data) => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('message', data);
      if (data.to_peer_id == 'all') {
        roomList.get(socket.room_id).broadCast(socket.id, 'message', data);
      } else {
        roomList.get(socket.room_id).sendTo(data.to_peer_id, 'message', data);
      }
    });

    socket.on('disconnect', () => {
      if (!roomList.has(socket.room_id)) return;

      log.debug('Disconnect', getPeerName());

      roomList.get(socket.room_id).removePeer(socket.id);

      if (roomList.get(socket.room_id).getPeers().size === 0) {
        if (roomList.get(socket.room_id).isLocked()) {
          roomList.get(socket.room_id).setLocked(false);
        }
        if (roomList.get(socket.room_id).isLobbyEnabled()) {
          roomList.get(socket.room_id).setLobbyEnabled(false);
        }
      }

      roomList.get(socket.room_id).broadCast(socket.id, 'removeMe', removeMeData());

      removeIP(socket);
    });

    socket.on('exitRoom', async (_, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({
          error: 'Not currently in a room',
        });
      }
      log.debug('Exit room', getPeerName());

      // close transports
      await roomList.get(socket.room_id).removePeer(socket.id);

      roomList.get(socket.room_id).broadCast(socket.id, 'removeMe', removeMeData());

      if (roomList.get(socket.room_id).getPeers().size === 0) {
        roomList.delete(socket.room_id);
      }

      socket.room_id = null;

      removeIP(socket);

      callback('Successfully exited room');
    });

    // common
    function getPeerName(json = true) {
      try {
        let peer_name =
          roomList.get(socket.room_id) &&
          roomList.get(socket.room_id).getPeers().get(socket.id).peer_info?.peer_name;
        if (json) {
          return {
            peer_name: peer_name,
          };
        }
        return peer_name;
      } catch (err) {
        log.error('getPeerName', err);
        return json ? { peer_name: 'undefined' } : 'undefined';
      }
    }

    function removeMeData() {
      return {
        room_id: roomList.get(socket.room_id) && socket.room_id,
        peer_id: socket.id,
        peer_counts: roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().size,
      };
    }
  });
}

module.exports = socket;