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
  Psychic: { strong: ['Fighting', 'Poison'], weak: ['Steel', 'Psychic'] },
  Flying: { strong: ['Grass', 'Fighting', 'Bug'], weak: ['Electric', 'Ice', 'Rock', 'Steel'] },
  Normal: { strong: [], weak: ['Rock', 'Steel', 'Fighting'] },
  Poison: { strong: ['Grass', 'Fairy'], weak: ['Ground', 'Psychic', 'Poison', 'Rock', 'Ghost'] },
  Rock: { strong: ['Fire', 'Flying', 'Ice', 'Bug'], weak: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'] },
  Ground: { strong: ['Fire', 'Electric', 'Rock', 'Poison', 'Steel'], weak: ['Water', 'Grass', 'Ice', 'Bug'] },
  Ghost: { strong: ['Ghost', 'Psychic'], weak: ['Ghost'] },
  Bug: { strong: ['Grass', 'Psychic'], weak: ['Fire', 'Flying', 'Rock', 'Fighting', 'Ghost', 'Steel', 'Fairy', 'Poison'] },
  Dragon: { strong: ['Dragon'], weak: ['Steel', 'Fairy'] },
  Fairy: { strong: ['Fighting', 'Dragon'], weak: ['Fire', 'Poison', 'Steel'] },
  Fighting: { strong: ['Normal', 'Rock', 'Steel', 'Ice'], weak: ['Psychic', 'Flying', 'Fairy', 'Bug', 'Poison'] },
  Steel: { strong: ['Rock', 'Ice', 'Fairy'], weak: ['Fire', 'Water', 'Electric', 'Steel'] },
};

export const STATUS_META: { [status: string]: { label: string; desc: string } } = {
  sleep: { label: 'Sleep', desc: '50% chance to wake and act; if the action fails, sleep ends.' },
  paralysis: { label: 'Paralysis', desc: '30% chance to be unable to act each turn.' },
  confuse: { label: 'Confuse', desc: '30% chance to hurt itself for 2 damage instead of acting.' },
  freeze: { label: 'Freeze', desc: 'Cannot act until thawed. 25% chance to thaw at end of turn.' },
  toxic: { label: 'Toxic', desc: 'Takes 1 damage every end of turn while afflicted.' },
  burn: { label: 'Burn', desc: 'Takes 1 damage every end of turn until cured.' },
  poison: { label: 'Poison', desc: 'Takes 1 damage every end of turn until cured.' }
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
  Fire: '#D85A30',
  Water: '#185FA5',
  Grass: '#3B6D11',
  Electric: '#BA7517',
  Ice: '#0C447C',
  Psychic: '#993556',
  Flying: '#534AB7',
  Normal: '#5F5E5A',
  Poison: '#72243E',
  Rock: '#5F5A5A',
  Ground: '#854F0B',
  Ghost: '#3C3489',
  Bug: '#6D8E1E',
  Dragon: '#5B7DD1',
  Fairy: '#C96BAA',
  Fighting: '#A63D2E',
  Steel: '#6F7C8B'
};
