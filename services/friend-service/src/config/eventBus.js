import EventBus from '../events/eventBus.js';
import env from './env.js';

const eventBus = new EventBus(env.REDIS_URI);

export default eventBus;
