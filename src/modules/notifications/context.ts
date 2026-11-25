import { createContext } from "react";
import type { Inbox } from "./inbox";

export const InboxContext = createContext<Inbox | null>(null);
