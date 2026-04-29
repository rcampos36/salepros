export type ProspectNote = {
  id: string;
  text: string;
  /** ISO timestamp when the note was added */
  createdAt: string;
};

export type ProspectVehicle = {
  mazdaModelId: string;
  mazdaModelLabel: string;
  mazdaTrimId: string;
  mazdaTrimLabel: string;
};

/** Staff-recorded disposition for this lead */
export type ProspectDealOutcome =
  | { status: "active" }
  | {
      status: "sold_here";
      purchasedAt: string | null;
      stockNumber: string | null;
      vehicle: ProspectVehicle | null;
    }
  | {
      status: "not_shopping";
      recordedAt: string | null;
    }
  | {
      status: "bought_elsewhere";
      recordedAt: string | null;
      /** Optional note — brand, dealer, etc. */
      detail: string | null;
    };

export const DEFAULT_DEAL_OUTCOME: ProspectDealOutcome = { status: "active" };

export type ProspectRecord = {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  vehicles: ProspectVehicle[];
  dealOutcome: ProspectDealOutcome;
  /**
   * Legacy single inquiry note — superseded by `noteHistory`; kept for older rows until migrated.
   */
  notes: string | null;
  noteHistory: ProspectNote[];
};
