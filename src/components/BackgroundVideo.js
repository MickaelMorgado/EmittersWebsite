import React from 'react'

function BackgroundVideo(props) {
  return (
    <div className="backgroundVideo backgroundVideo--16by9">
      <div className="backgroundVideo__video">
        {props.children}
      </div>
    </div>
  )
}

export default BackgroundVideo

