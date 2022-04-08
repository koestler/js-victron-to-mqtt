import React, { useState, useEffect } from 'react'
import { Block, Button, Progress, Box } from 'react-bulma-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useAuth } from '../hooks/auth'

export const AutoplayContext = React.createContext({ play: false, values: null })

const Autoplay = ({ viewName, play, setPlay, values, setValues }) => {
  const [connectionState, setConnectionState] = useState('never started')

  return (
    <>
      <AutoplayBox play={play} setPlay={setPlay} connectionState={connectionState} />
      {play && <Websocket viewName={viewName} setConnectionState={setConnectionState} values={values} setValues={setValues} />}
    </>
  )
}

const Websocket = ({ viewName, setConnectionState, values, setValues }) => {
  const { isLoggedIn, getToken } = useAuth()
  const { lastJsonMessage, readyState, sendJsonMessage } = useWebSocket(websocketUrl(`values/${viewName}/ws`))

  // update values
  useEffect(() => {
    console.log('update values', lastJsonMessage)
    setValues(lastJsonMessage)
    return () => setValues(null)
  }, [lastJsonMessage, setValues])

  // send authentication message after connect when logged in
  useEffect(() => {
    if (readyState === ReadyState.OPEN && isLoggedIn()) {
      sendJsonMessage({ authToken: getToken() })
    }
  }, [readyState])

  // update connectionState
  useEffect(() => {
    setConnectionState(readyStateToString(readyState))
    return () => {
      setConnectionState('closed')
    }
  }, [readyState, setConnectionState])

  return <></>
}

const websocketUrl = (endpoint) => {
  const loc = window.location
  let uri
  if (loc.protocol === 'https:') {
    uri = 'wss:'
  } else {
    uri = 'ws:'
  }
  uri += '//' + loc.host
  uri += '/api/v1/'
  uri += endpoint
  return uri
}

const readyStateToString = (readyState) => {
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated'
  }
  return connectionStatus[readyState]
}

const AutoplayBox = ({ play, setPlay, connectionState }) => {
  const playButton = (
    <Button onClick={() => setPlay(!play)}>
      <FontAwesomeIcon icon={play ? faStop : faPlay} />
    </Button>
  )

  let isPlaying = null
  if (play) {
    isPlaying = (
      <Block>
        <p>values are live</p>
        <Progress />
      </Block>
    )
  }

  return (
    <Box>
      {playButton}
      {isPlaying}
      <Block>{connectionState}</Block>
    </Box>
  )
}

export default Autoplay
