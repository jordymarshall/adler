import { portfolioStory } from "./landing-story";

export type LandingScreen = "goals" | "plan" | "barrier" | "progress" | "checkin" | "review" | "insights" | "imessage";

// Eight parts of one dated story. Small state changes share one explanation.
export const landingBeats: { screen: LandingScreen; title: string; date: string; explanation: string; frames: number; research?: "proposed" | "reviewed" }[] = [
  { screen: "goals", title: "Turn your goal into a first plan.", date: "Sep 21", explanation: "Your goal, deadline and available time shape the first plan.", frames: 3 },
  { screen: "plan", title: "See what to do today.", date: "Oct 8", explanation: "Today’s actions come from your saved goals and schedule.", frames: 3 },
  { screen: "barrier", title: "Say what got in the way.", date: "Oct 10", explanation: "Adler checks whether you need the phone before suggesting you put it away.", frames: 3 },
  { screen: "progress", title: "See what’s changed.", date: "Oct 11", explanation: "Writing time and published work are separate reports. The projection shows what could happen if the recorded pattern continues.", frames: 1 },
  { screen: "checkin", title: "Try a change with a reason.", date: "Oct 12", explanation: portfolioStory.rationale, frames: 2, research: "proposed" },
  { screen: "review", title: "See what happened.", date: "Oct 19", explanation: "Two reported sessions support trying again. They don’t establish a personal rule.", frames: 1, research: "reviewed" },
  { screen: "insights", title: "Put what you learned into your plan.", date: "Oct 19", explanation: "The change you agree to becomes your next action. Adler keeps the original test and reports.", frames: 2, research: "reviewed" },
  { screen: "imessage", title: "Keep going by text.", date: "Oct 20", explanation: "Text and the app use the same goal, plan and reports.", frames: 4 },
];

export const landingFrames = landingBeats.flatMap((beat, beatIndex) => Array.from({ length: beat.frames }, (_, phase) => ({ beat, beatIndex, phase })));
