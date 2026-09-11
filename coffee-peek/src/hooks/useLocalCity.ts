import { useCallback, useEffect, useState } from 'react';
import { getSelectedCityId, setSelectedCityId, subscribeCity } from '../lib/localCity';

/** React hook for the device-local selected city (chosen in Settings). */
export function useLocalCity() {
  const [cityId, setCityIdState] = useState<string>(() => getSelectedCityId());

  useEffect(() => subscribeCity(() => setCityIdState(getSelectedCityId())), []);

  const setCityId = useCallback((id: string) => setSelectedCityId(id), []);

  return { cityId, setCityId };
}
