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
        <p>Emitters is a single / co-op first-person shooter 🔫 survival <br/>drone invasions game, where deadly machines 🤖 were deployed throughout multiple levels 🌳 <br/>with the single intent of shooting you dead! ☠️</p>
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
            style={{
              backgroundColor: "black"
            }}
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
