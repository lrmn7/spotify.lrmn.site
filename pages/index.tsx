/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
import type { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-js";

interface HomeProps {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

const Home: NextPage<HomeProps> = ({ clientId, clientSecret, refreshToken }) => {
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const spotifyApi = new SpotifyWebApi();

  useEffect(() => {
    const updateCurrentPlayback = async () => {
      try {
        const token = await getAccessToken(clientId, clientSecret, refreshToken);
        spotifyApi.setAccessToken(token);
        const response = await spotifyApi.getMyCurrentPlaybackState();
        setCurrentTrack(response);
      } catch (error) {
        console.error(error);
      }
    };

    const interval = setInterval(updateCurrentPlayback, 1000);

    return () => clearInterval(interval);
  }, []);

  async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok) {
      return data.access_token;
    } else {
      throw new Error(data.error || "Failed to get access token");
    }
  }

  function formatDuration(durationMs: number) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <>
      <Head>
        <title>
          Listening to:{" "}
          {currentTrack && currentTrack.item && !currentTrack.item.is_ad
            ? currentTrack.item.name
            : "Not listening to anything"}
        </title>

        <meta name="theme-color" content="#1DB954" />

        <meta name="og:title" content="L RMN - Spotify Everything" />
        <meta
          name="og:description"
          content={`L RMN is currently listening to ${
            currentTrack && currentTrack.item && !currentTrack.item.is_ad
              ? currentTrack.item.name + " by " + currentTrack.item.artists[0].name
              : "nothing"
          }`}
        />
        {currentTrack && currentTrack.item && currentTrack.item.album && currentTrack.item.album.images[0] && (
          <meta name="og:image" content={currentTrack.item.album.images[0].url} />
        )}
      </Head>

      <div className="w-[100vw] h-[100vh] flex items-center justify-center text-white z-[20]">
        {currentTrack && currentTrack.item && !currentTrack.item.is_ad ? (
          <div className="p-8 w-[33rem] bg-[#000] bg-opacity-60 rounded-lg flex flex-col items-center justify-start font-karla">
            <div className="w-full flex flex-row items-center justify-start mb-6">
              <img
                src={currentTrack.item.album.images[0].url}
                className="w-[8rem] h-[8rem] rounded-md"
                alt="Album Art"
              />
              <div className="ml-6 flex flex-col items-start justify-center">
                <a
                  href={currentTrack.item.external_urls.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xl text-white font-semibold"
                >
                  {currentTrack.item.name}
                </a>
                <h2 className="text-lg text-gray-300 font-normal">{currentTrack.item.artists[0].name}</h2>
                <h3 className="text-lg text-gray-300 font-normal italic">{`in ${currentTrack.item.album.name}`}</h3>
              </div>
            </div>
            <div className="w-full h-[0.35rem] rounded-full bg-gray-700 mb-1">
              <div
                className="bg-gray-300 h-[0.35rem] rounded-full"
                style={{
                  width: `${(
                    ((new Date().getTime() - currentTrack.timestamp) / currentTrack.item.duration_ms) *
                    100
                  ).toString()}%`,
                }}
              />
            </div>
            <div className="w-full h-auto flex flex-row items-center justify-between text-base text-gray-400">
              <p>{formatDuration(currentTrack.progress_ms)}</p>
              <p>{formatDuration(currentTrack.item.duration_ms)}</p>
            </div>
          </div>
        ) : (
          <div className="w-[33rem] h-[20rem] bg-[#000] bg-opacity-60 rounded-lg flex items-center justify-center">
            <h1 className="text-3xl text-white">Not listening to anything right now</h1>
          </div>
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const clientId = process.env.CLIENT_ID || "";
  const clientSecret = process.env.CLIENT_SECRET || "";
  const refreshToken = process.env.REFRESH_TOKEN || "";

  return {
    props: {
      clientId,
      clientSecret,
      refreshToken,
    },
  };
};

export default Home;