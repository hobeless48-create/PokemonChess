/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TEFF: { [type: string]: { strong: string[]; weak: string[] } } = {
  Fire: { strong: ['Grass', 'Ice', 'Bug', 'Steel'], weak: ['Water', 'Rock', 'Fire', 'Dragon'] },
  Water: { strong: ['Fire', 'Rock', 'Ground'], weak: ['Grass', 'Electric', 'Water', 'Dragon'] },
  Grass: { strong: ['Water', 'Rock', 'Ground'], weak: ['Fire', 'Ice', 'Flying', 'Poison', 'Bug', 'Dragon', 'Steel'] },
  Electric: { strong: ['Water', 'Flying'], weak: ['Ground', 'Grass', 'Electric', 'Dragon'] },
  Ice: { strong: ['Grass', 'Flying', 'Ground', 'Dragon'], weak: ['Fire', 'Rock', 'Steel', 'Water'] },
  Psychic: { strong: ['Fighting', 'Poison'], weak: ['Steel', 'Psychic', 'Dark'] },
  Flying: { strong: ['Grass', 'Fighting', 'Bug'], weak: ['Electric', 'Ice', 'Rock', 'Steel'] },
  Normal: { strong: [], weak: ['Rock', 'Steel', 'Fighting'] },
  Poison: { strong: ['Grass', 'Fairy'], weak: ['Ground', 'Psychic', 'Poison', 'Rock', 'Ghost'] },
  Rock: { strong: ['Fire', 'Flying', 'Ice', 'Bug'], weak: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'] },
  Ground: { strong: ['Fire', 'Electric', 'Rock', 'Poison', 'Steel'], weak: ['Water', 'Grass', 'Ice', 'Bug'] },
  Ghost: { strong: ['Ghost', 'Psychic'], weak: ['Ghost', 'Dark'] },
  Bug: { strong: ['Grass', 'Psychic', 'Dark'], weak: ['Fire', 'Flying', 'Rock', 'Fighting', 'Ghost', 'Steel', 'Fairy', 'Poison'] },
  Dragon: { strong: ['Dragon'], weak: ['Steel', 'Fairy'] },
  Fairy: { strong: ['Fighting', 'Dragon', 'Dark'], weak: ['Fire', 'Poison', 'Steel'] },
  Fighting: { strong: ['Normal', 'Rock', 'Steel', 'Ice', 'Dark'], weak: ['Psychic', 'Flying', 'Fairy', 'Bug', 'Poison'] },
  Steel: { strong: ['Rock', 'Ice', 'Fairy'], weak: ['Fire', 'Water', 'Electric', 'Steel'] },
  Dark: { strong: ['Psychic', 'Ghost'], weak: ['Fighting', 'Dark', 'Fairy'] },
};

export const STATUS_META: { [status: string]: { label: string; desc: string } } = {
  sleep: { label: 'Sleep', desc: 'Cannot act. 50% chance to wake up each turn (until wake).' },
  paralysis: { label: 'Paralysis', desc: '30% chance to be unable to act each turn (permanent).' },
  confuse: { label: 'Confuse', desc: '25% chance to hurt itself for 1 damage instead of acting (permanent).' },
  freeze: { label: 'Freeze', desc: 'Cannot act. Thaws automatically after 1 turn.' },
  toxic: { label: 'Toxic', desc: 'Takes 1 damage at the end of each turn (permanent).' },
  burn: { label: 'Burn', desc: 'Takes 1 damage at the end of each turn (2 turns max).' },
  poison: { label: 'Poison', desc: 'Takes 1 damage at the end of each turn (permanent).' }
};

export const SCOL: { [status: string]: string } = {
  burn: '#F0997B',
  poison: '#B5D4F4',
  paralysis: '#FAC775',
  sleep: '#D3D1C7',
  freeze: '#B5D4F4',
  confuse: '#AFA9EC',
  toxic: '#A064BE'
};

export const TCOL: { [type: string]: string } = {
  Normal: '#A8A77A',
  Fire: '#EE8130',
  Water: '#6390F0',
  Electric: '#F7D02C',
  Grass: '#7AC74C',
  Ice: '#96D9D6',
  Fighting: '#C22E28',
  Poison: '#A33EA1',
  Ground: '#E2BF65',
  Flying: '#A98FF3',
  Psychic: '#F95587',
  Bug: '#A6B91A',
  Rock: '#B6A136',
  Ghost: '#735797',
  Dragon: '#6F35FC',
  Dark: '#705746',
  Steel: '#B7B7CE',
  Fairy: '#D685AD'
};
