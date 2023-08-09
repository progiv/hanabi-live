import { ALL_RESERVED_NOTES } from "./abbreviations";
import suitsJSON from "./json/suits.json";
import type { Color } from "./types/Color";
import type { Suit } from "./types/Suit";
import type { SuitJSON } from "./types/SuitJSON";

const SUIT_REVERSED_SUFFIX = " Reversed";

export function suitsInit(
  COLORS: ReadonlyMap<string, Color>,
): ReadonlyMap<string, Suit> {
  const suits = new Map<string, Suit>();

  if (suitsJSON.length === 0) {
    throw new Error('The "suits.json" file did not have any elements in it.');
  }

  for (const suitJSON of suitsJSON) {
    // Validate the name
    if (suitJSON.name === "") {
      throw new Error(
        'There is a suit with an empty name in the "suits.json" file.',
      );
    }
    const { name } = suitJSON;

    // If the abbreviation for the suit is not specified, use the abbreviation of the color with the
    // same name. Otherwise, assume that it is the first letter of the suit.
    let { abbreviation } = suitJSON;
    if (abbreviation === undefined) {
      const color = COLORS.get(name);
      abbreviation = color === undefined ? name.charAt(0) : color.abbreviation;
    }

    // Validate the abbreviation.
    if (abbreviation.length !== 1) {
      throw new Error(
        `The "${suitJSON.name}" suit has an abbreviation of "${abbreviation}" that is not one letter long.`,
      );
    }
    if (abbreviation !== abbreviation.toUpperCase()) {
      throw new Error(
        `The "${suitJSON.name}" suit has an abbreviation of "${abbreviation}" that is not an uppercase letter.`,
      );
    }
    if (ALL_RESERVED_NOTES.has(abbreviation.toLowerCase())) {
      throw new Error(
        `The "${suitJSON.name}" suit has an abbreviation of "${abbreviation}" that conflicts with a reserved note word.`,
      );
    }

    // Validate the clue properties. If these are not specified, the suit functions normally. (This
    // has to be done before validating the clue colors.)

    if (suitJSON.allClueColors === false) {
      throw new Error(
        `The "allClueColors" property for the suit "${suitJSON.name}" must be set to true. If it is intended to be false, then remove the property altogether.`,
      );
    }
    const allClueColors = suitJSON.allClueColors ?? false;

    if (suitJSON.allClueRanks === false) {
      throw new Error(
        `The "allClueRanks" property for the suit "${suitJSON.name}" must be set to true. If it is intended to be false, then remove the property altogether.`,
      );
    }
    const allClueRanks = suitJSON.allClueRanks ?? false;

    if (suitJSON.noClueColors === false) {
      throw new Error(
        `The "noClueColors" property for the suit "${suitJSON.name}" must be set to true. If it is intended to be false, then remove the property altogether.`,
      );
    }
    const noClueColors = suitJSON.noClueColors ?? false;

    if (suitJSON.noClueRanks === false) {
      throw new Error(
        `The "noClueRanks" property for the suit "${suitJSON.name}" must be set to true. If it is intended to be false, then remove the property altogether.`,
      );
    }
    const noClueRanks = suitJSON.noClueRanks ?? false;

    if (suitJSON.prism === false) {
      throw new Error(
        `The "prism" property for the suit "${suitJSON.name}" must be set to true. If it is intended to be false, then remove the property altogether.`,
      );
    }
    const prism = suitJSON.prism ?? false;

    // Validate the clue colors (the colors that touch this suit) and convert the string array to a
    // color object array. If the clue colors are not specified, use the color of the same name.
    const clueColors = getSuitClueColors(suitJSON, COLORS);

    // Validate the display name.
    if (suitJSON.displayName === "") {
      throw new Error(
        'There is a suit with an empty display name in the "suits.json" file.',
      );
    }

    // The display name is optional; if not specified, then use the normal suit name.
    const displayName = suitJSON.displayName ?? suitJSON.name;

    // Validate the fill.
    const { fill, fillColorblind } = getSuitFillAndFillColorblind(
      suitJSON,
      COLORS,
      clueColors,
    );

    // Validate the fill colors.
    if (suitJSON.fillColors !== undefined && suitJSON.fillColors.length === 0) {
      throw new Error(
        `The "fillColors" array for the suit "${suitJSON.name}" is empty.`,
      );
    }
    const fillColors = suitJSON.fillColors ?? [];

    // Validate the "oneOfEach" property. If it is not specified, the suit is not one of each (e.g.
    // every card is not critical).
    if (suitJSON.oneOfEach === false) {
      throw new Error(
        `The "oneOfEach" property for the suit "${suitJSON.name}" must be set to true. If it is intended to be false, then remove the property altogether.`,
      );
    }
    const oneOfEach = suitJSON.oneOfEach ?? false;

    // Validate the "pip" property.
    if (suitJSON.pip === "" && suitJSON.name !== "Unknown") {
      throw new Error(
        `The "pip" property for the suit "${suitJSON.name}" is empty.`,
      );
    }
    const { pip } = suitJSON;

    // Construct the suit object and add it to the map.
    const suit: Suit = {
      name,
      abbreviation,
      clueColors,
      displayName,
      fill,
      fillColorblind,
      fillColors,
      oneOfEach,
      pip,
      reversed: false,

      allClueColors,
      allClueRanks,
      noClueColors,
      noClueRanks,
      prism,
    };
    suits.set(suitJSON.name, suit);

    // Additionally, add the reversed version of this suit.
    const suitReversed: Suit = {
      ...suit,
      reversed: true,
    };
    suits.set(suitJSON.name + SUIT_REVERSED_SUFFIX, suitReversed);
  }

  return suits;
}

function getSuitClueColors(
  suitJSON: SuitJSON,
  COLORS: ReadonlyMap<string, Color>,
): Color[] {
  if (suitJSON.clueColors !== undefined) {
    // Convert the color name strings to color objects.
    return suitJSON.clueColors.map((colorName) => {
      const color = COLORS.get(colorName);
      if (color === undefined) {
        throw new Error(
          `The clue color "${colorName}" for the suit "${suitJSON.name}" does not exist.`,
        );
      }

      return color;
    });
  }

  // The "Unknown" suit is not supposed to have clue colors.
  if (suitJSON.name === "Unknown") {
    return [];
  }

  // Some special suits do not have clue colors explicitly assigned to them.
  if (
    suitJSON.allClueColors === true ||
    suitJSON.noClueColors === true ||
    suitJSON.prism === true
  ) {
    return [];
  }

  // The clue colors were not specified; by default, use the color of the same name.
  const color = COLORS.get(suitJSON.name);
  if (color !== undefined) {
    return [color];
  }

  throw new Error(
    `Failed to derive the clue colors for the "${suitJSON.name}" suit. (There is no corresponding color named "${suitJSON.name}".)`,
  );
}

/**
 * If the fill is not specified, use the fill of the color with the same name. Otherwise, assume the
 * fill of the first clue color. (For example, "Red" does not have any clue colors specified, so the
 * intermediate condition is necessary.)
 *
 * We also need to compute a "fillColorblind" property for the suit.
 */
function getSuitFillAndFillColorblind(
  suitJSON: SuitJSON,
  COLORS: ReadonlyMap<string, Color>,
  clueColors: Color[],
): {
  fill: string;
  fillColorblind: string;
} {
  if (suitJSON.fill === "") {
    throw new Error(
      `The fill property was empty for the "${suitJSON.name}" suit. Perhaps it should be removed entirely from the "suits.json" file?`,
    );
  }

  if (suitJSON.fill !== undefined) {
    return {
      fill: suitJSON.fill,
      fillColorblind: suitJSON.fill,
    };
  }

  const color = COLORS.get(suitJSON.name);
  if (color !== undefined) {
    // The "fill" and the "fillColorblind" properties are validated to not be empty in
    // "colorsInit.ts".
    return {
      fill: color.fill,
      fillColorblind: color.fillColorblind,
    };
  }

  const firstClueColor = clueColors[0];
  if (firstClueColor !== undefined) {
    // The "fill" and the "fillColorblind" properties are validated to not be empty in
    // "colorsInit.ts".
    return {
      fill: firstClueColor.fill,
      fillColorblind: firstClueColor.fillColorblind,
    };
  }

  throw new Error(
    `Failed to find the fill for the "${suitJSON.name}" suit. (There is no corresponding color named "${suitJSON.name}" and this suit has no clue colors specified.)`,
  );
}
