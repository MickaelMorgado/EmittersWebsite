import { useEffect } from 'react';
import './App.css'
import MainWebsitePage from './MainWebsitePage'
import ThreeJSExample from './ThreeJSExample'
import Test from './Test';

const App = () => {
  return (
    <>
      <div id="website-content" className='page-home'>
        {/*<ThreeJSExample />
        <MainWebsitePage />*/}
        <Test />
      </div>
    </>
  )
}

export default App
