import { createContext } from 'react';

const RefreshListingContext = createContext<() => void>(() => {});
export default RefreshListingContext;
