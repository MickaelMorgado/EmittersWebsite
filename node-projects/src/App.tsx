import './App.css'
import MainWebsitePage from './MainWebsitePage'
import ThreeJSExample from './ThreeJSExample'

const App = () => {
  return (
    <>
      <div id="website-content" className='page-home'>
        <ThreeJSExample />
        <MainWebsitePage />
      </div>
    </>
  )
}

export default App
