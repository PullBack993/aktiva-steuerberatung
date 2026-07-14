import React from 'react';
import { Composition } from 'remotion';
import { AktivaHero } from './AktivaHero.jsx';

export const RemotionRoot = () => {
  return (
    <Composition
      id="AktivaHero"
      component={AktivaHero}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1350}
    />
  );
};
