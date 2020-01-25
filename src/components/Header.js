import PropTypes from 'prop-types'
import React from 'react'

import logo from '../images/logo.png'

const Header = props => (
  <header id="header" style={props.timeout ? { display: 'none' } : {}}>
    <div className="logo-container">
      {<img src={logo} className="logo" alt="drone logo"/>}
    </div>
    <div className="content">
      <div className="inner">
        <p>Welcome to Emitters 
          <br/> a single / co-op first-person shooter based on survival drone invasions game.
          <br /> Deadly machines were deployed throughout multiple levels 🌳
          <br/> with the single intent of shooting you dead! ☠️
          <br/><br/>
          This game is made for you if you like:
        </p>
        <ul className="intro-list">
          <li>🚁 DRONES</li>
          <li>🤖 ANDROIDS</li>
          <li>⚡ ELECTRIC STUFFS</li>
          <li>🌦️ CYBER RAIN METEO</li>
          <li>🔫 DOOM's LIKE WEAPONS</li>
          <li>📼 5TH ELEMENT, OBLIVION MOVIES</li>
          <li>🎖️ CALL OF DUTY GAMEPLAY</li>
        </ul>
      </div>
    </div>
    <nav>
      <ul>
        <li>
          <button
            className="primary-button"
            onClick={() => {
              props.onOpenArticle('intro')
            }}
          >
            I want this
          </button>
        </li>
        <li>
          <button
            className="secondary-button"
            onClick={() => {
              props.onOpenArticle('contact')
            }}
          >
            Not convinced?
          </button>
        </li>
      </ul>
    </nav>
  </header>
)

Header.propTypes = {
  onOpenArticle: PropTypes.func,
  timeout: PropTypes.bool,
}

export default Header
