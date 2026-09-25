import { useEffect } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import EnquiryModal from './components/EnquiryForm.jsx';
import { RegistrationProvider } from './components/RegistrationContext.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import EventPage from './pages/Event.jsx';
import Gallery from './pages/Gallery.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import Contact from './pages/Contact.jsx';
import Register from './pages/Register.jsx';
import Certificate from './pages/Certificate.jsx';
import IdCard from './pages/IdCard.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import AdminLogin from './admin/Login.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Posts from './admin/Posts.jsx';
import PostEditor from './admin/PostEditor.jsx';
import Registrations from './admin/Registrations.jsx';
import Enquiries from './admin/Enquiries.jsx';
import Team from './admin/Team.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces matter: newer browsers return a Promise from scrollTo, which React would treat as a cleanup.
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function SiteLayout() {
  return (
    <RegistrationProvider>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <EnquiryModal />
    </RegistrationProvider>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="event" element={<EventPage />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="contact" element={<Contact />} />
          <Route path="register" element={<Register />} />
          <Route path="certificate" element={<Certificate />} />
          <Route path="id-card" element={<IdCard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/new" element={<PostEditor />} />
          <Route path="posts/:id/edit" element={<PostEditor />} />
          <Route path="team" element={<Team />} />
        </Route>
      </Routes>
    </>
  );
}
