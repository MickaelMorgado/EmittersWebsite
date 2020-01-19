import React from 'react'

export default function SteamWidget(props) {
  return (
    <iframe 
      src={`https://store.steampowered.com/widget/${props.gameId}`} 
      frameborder="0" 
      width="646" 
      height="190"></iframe>
  )
}
