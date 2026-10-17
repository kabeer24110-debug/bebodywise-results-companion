import { HashRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import FitFinder from './pages/FitFinder';
import Library from './pages/Library';
import ProductGuide from './pages/ProductGuide';
import Journeys from './pages/Journeys';
import JourneyDetail from './pages/JourneyDetail';
import Coach from './pages/Coach';
import Routine from './pages/Routine';
import QuickAnswers from './pages/QuickAnswers';
import Myths from './pages/Myths';
import Reminders from './pages/Reminders';
import About from './pages/About';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fit-finder" element={<FitFinder />} />
            <Route path="/products" element={<Library />} />
            <Route path="/products/:id" element={<ProductGuide />} />
            <Route path="/journeys" element={<Journeys />} />
            <Route path="/journeys/:id" element={<JourneyDetail />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/routine" element={<Routine />} />
            <Route path="/answers" element={<QuickAnswers />} />
            <Route path="/myths" element={<Myths />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </HashRouter>
    </StoreProvider>
  );
}
