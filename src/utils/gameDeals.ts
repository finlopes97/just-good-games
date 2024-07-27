import axios from 'axios';

const API_KEY = import.meta.env.ITAD_API_KEY;
const BASE_URL = 'https://api.isthereanydeal.com';

if (!API_KEY) {
  console.error('API Key is missing');
}

export async function getGameId(gameTitle: string): Promise<string | null> {
  try {
    console.log(`Fetching game ID for: ${gameTitle}`);
    const url = `${BASE_URL}/games/lookup/v1`;
    console.log(`URL: ${url}?key=${API_KEY}&title=${gameTitle}`);
    const response = await axios.get(url, {
      params: {
        key: API_KEY,
        title: gameTitle,
      },
    });
    console.log('API Response:', response.data);

    if (response.data.found) {
      return response.data.game.id;
    }
    console.log('Game not found');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Config:', error.config);
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
}

export async function getBestDeal(gameId: string) {
  try {
    console.log(`Fetching best deal for game ID: ${gameId}`);
    const url = `${BASE_URL}/games/prices/v2`;
    console.log(`URL: ${url}`);
    const response = await axios.post(url,
      [gameId],
      {
        params: {
          key: API_KEY,
          country: 'AU',
          nondeals: true,
        },
      }
    );

    console.log('API Response:', response.data);

    if (response.data.length > 0 && response.data[0].deals && response.data[0].deals.length > 0) {
      return response.data[0].deals.reduce((best, current) =>
        current.price_new < best.price_new ? current : best
      );
    }
    console.log('No deals found');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Config:', error.config);
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
}
