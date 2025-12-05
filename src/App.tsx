import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EventsPage } from './routes/EventsPage';
import { BookEventPage } from './routes/BookEventPage';
import { ThankYouPage } from './routes/ThankYouPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EventsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/book/:eventId" element={<BookEventPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
