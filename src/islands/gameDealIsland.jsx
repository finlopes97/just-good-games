// GameDealIsland.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_KEY = import.meta.env.PUBLIC_ITAD_API_KEY;
const BASE_URL = 'https://api.isthereanydeal.com';

const GameDealIsland = ({ gameTitle }) => {
  const [bestDeal, setBestDeal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGameDeal = async () => {
      try {
        const gameIdResponse = await axios.get(`${BASE_URL}/games/lookup/v1`, {
          params: {
            key: API_KEY,
            title: gameTitle,
          },
        });

        if (gameIdResponse.data.found) {
          const gameId = gameIdResponse.data.game.id;
          const bestDealResponse = await axios.post(`${BASE_URL}/games/prices/v2`, [gameId], {
            params: {
              key: API_KEY,
              country: 'AU',
              nondeals: true,
            },
          });

          if (
            bestDealResponse.data.length > 0 &&
            bestDealResponse.data[0].deals &&
            bestDealResponse.data[0].deals.length > 0
          ) {
            const bestDeal = bestDealResponse.data[0].deals.reduce((best, current) =>
              current.price_new < best.price_new ? current : best
            );
            setBestDeal(bestDeal);
          } else {
            setBestDeal(null);
          }
        } else {
          setError(`Game "${gameTitle}" not found`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      }
    };

    fetchGameDeal();
  }, [gameTitle]);

  if (error) {
    return (
      <div className="bg-red-100 border-4 border-red-500 shadow-[2px_2px_0px_rgba(0,0,0,1)] p-4 flex-1">
        <h3 className="text-xl font-bold mb-2">Error fetching deal for {gameTitle}</h3>
        <p className="font-body">{error}</p>
      </div>
    );
  }

  if (bestDeal) {
    return (
      <div className="bg-body-300 border-4 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] p-4 flex-1">
        <h3 className="text-xl font-bold font-heading text-center mb-2 bg-white inline-block px-4 py-2 border-4 border-black">
          Best Deal for {gameTitle}
        </h3>
        <div className="flex flex-col gap-1 mb-4">
          <p className="bg-white p-2 border-4 border-black">
            <span className="font-bold font-mono uppercase tracking-wide">Store:</span> {bestDeal.shop.name}
          </p>
          <p className="bg-white p-2 border-4 border-black">
            <span className="font-bold font-mono uppercase tracking-wide">Price:</span> AU${bestDeal.price.amount} (was ${bestDeal.regular.amount})
          </p>
          <p className="bg-white p-2 border-4 border-black">
            <span className="font-bold font-mono uppercase tracking-wide">Discount:</span> {bestDeal.cut}% off
          </p>
          <a href="https://isthereanydeal.com/" target="_blank" className="font-mono tracking-wider">
            Deals provided by <span className="underline text-purple-800">IsThereAnyDeal.com</span>
          </a>
        </div>
        <NavLink target={bestDeal.url} title="Get Deal" />
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] p-4 flex-1">
      <h3 className="text-xl font-bold mb-2">No deals found for {gameTitle}</h3>
      <p className="font-body">Try checking back later for deals on this game.</p>
    </div>
  );
};

export default GameDealIsland;
