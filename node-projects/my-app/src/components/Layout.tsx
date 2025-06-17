import { Outlet } from 'react-router-dom';
import '../styles/Layout.css';

const Layout = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

export default Layout;
