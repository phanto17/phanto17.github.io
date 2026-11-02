import { describe, expect, it } from 'vitest';
import { PREVIEW_PATH, hashAfterClose, parseLabHash, stageForKey, toPortalId, toStageId } from '../src/scripts/telegraph-popup';

describe('popup pure parts', () => {
  it('narrows attribute values to stage and portal ids', () => {
    expect(toStageId('title-intro')).toBe('title-intro');
    expect(toStageId('neon')).toBeNull();
    expect(toStageId(null)).toBeNull();
    expect(toPortalId('tactics-shove')).toBe('tactics-shove');
    expect(toPortalId('')).toBeNull();
  });

  it('maps number keys to stages', () => {
    expect(stageForKey('1')).toBe('welcome');
    expect(stageForKey('3')).toBe('title-intro');
    expect(stageForKey('4')).toBeNull();
    expect(stageForKey('a')).toBeNull();
  });

  it('restores the arrival hash after closing unless it was a stage deep link', () => {
    expect(hashAfterClose('')).toBe('');
    expect(hashAfterClose('#projects')).toBe('#projects');
    expect(hashAfterClose('#lab')).toBe('#lab');
    expect(hashAfterClose('#lab?stage=welcome')).toBe('#lab');
    expect(hashAfterClose(null)).toBe('#lab');
  });

  it('reads the lab hash', () => {
    expect(parseLabHash('#lab?stage=animation-sequence')).toEqual({ lab: true, stage: 'animation-sequence' });
    expect(parseLabHash('#lab?stage=nope')).toEqual({ lab: true, stage: null });
    expect(parseLabHash('#about')).toEqual({ lab: false, stage: null });
  });

  it('keeps the preview path on the board', () => {
    expect(PREVIEW_PATH.every((cell) => cell >= 0 && cell < 16)).toBe(true);
  });
});
