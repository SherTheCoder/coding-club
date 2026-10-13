import {createRoot} from 'react-dom/client';
import Clubhouse from './app/clubhouse';
import {upcomingSessions} from './lib/club.mjs';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<Clubhouse initialDates={upcomingSessions()}/>);
