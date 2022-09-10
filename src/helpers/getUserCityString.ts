const cities: Record<string, string> = {
  SPB: 'Санкт-Петербург',
  MSK: 'Москва',
};

export function getUserCityString(city: string) {
  return cities[city] || cities.SPB;
}
