import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InLens } from "@inlens/react";
import "./styles.css";

function Demo() {
  return (
    <main>
      <header className="site-header">
        <p className="eyebrow">@inlens/react · CSS field tests</p>
        <h1>Three unreasonable magnifiers.</h1>
        <p className="lede">
          One compound API, zero library styles, and three completely different coordinate systems.
          Move a mouse or pen across any specimen.
        </p>
        <nav aria-label="Example variants">
          <a href="#chromatic-triplets">01 Prism</a>
          <a href="#conspiracy-microscope">02 Evidence</a>
          <a href="#wormhole-radio">03 Signal</a>
        </nav>
      </header>

      <section
        id="chromatic-triplets"
        className="demo demo--prism"
        data-example="chromatic-triplets"
        aria-labelledby="prism-title"
      >
        <header className="demo-copy">
          <p>Variant 01 · Lens × 3</p>
          <h2 id="prism-title">Chromatic Triplets</h2>
          <span>Three independently measured lenses, no Panel required.</span>
        </header>

        <div className="prism-stage">
          <InLens.Root zoom={2.6} className="prism-root">
            <InLens.Image className="prism-source">
              <img src="/prism.svg" alt="Vivid geometric composition with eyes and orbital forms" />
            </InLens.Image>

            <InLens.Lens className="prism-lens prism-lens--cyan">
              <InLens.Magnified className="magnified prism-surface prism-surface--cyan">
                <img src="/prism.svg" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <InLens.Lens className="prism-lens prism-lens--magenta">
              <InLens.Magnified className="magnified prism-surface prism-surface--magenta">
                <img src="/prism.svg" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <InLens.Lens className="prism-lens prism-lens--acid">
              <InLens.Magnified className="magnified prism-surface prism-surface--acid">
                <img src="/prism.svg" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <span className="prism-orbit" aria-hidden="true" />
          </InLens.Root>
        </div>
      </section>

      <section
        id="conspiracy-microscope"
        className="demo demo--evidence"
        data-example="conspiracy-microscope"
        aria-labelledby="evidence-title"
      >
        <header className="demo-copy evidence-copy">
          <p>Case 08–14 · Panel × 2 + Tracker</p>
          <h2 id="evidence-title">Conspiracy Microscope</h2>
          <span>The Tracker intentionally follows the first Panel in DOM order.</span>
        </header>

        <div className="evidence-stage">
          <InLens.Root zoom={3.4} className="evidence-root">
            <InLens.Image className="evidence-source">
              <img
                src="/evidence.svg"
                alt="Surreal evidence dossier covered in marks and annotations"
              />
            </InLens.Image>

            <InLens.Tracker className="evidence-tracker" />

            <InLens.Panel as="aside" className="evidence-panel evidence-panel--film">
              <InLens.Magnified className="magnified evidence-surface">
                <img src="/evidence.svg" alt="" />
              </InLens.Magnified>
              <span className="evidence-readout">ENHANCE // MATCH 87%</span>
            </InLens.Panel>

            <InLens.Panel as="aside" className="evidence-panel evidence-panel--stamp">
              <InLens.Magnified className="magnified evidence-surface">
                <img src="/evidence.svg" alt="" />
              </InLens.Magnified>
            </InLens.Panel>

            <span className="evidence-pin evidence-pin--one" aria-hidden="true" />
            <span className="evidence-pin evidence-pin--two" aria-hidden="true" />
            <span className="evidence-thread" aria-hidden="true" />
            <span className="evidence-note" aria-hidden="true">
              WHO MOVED THE TRIANGLE?
            </span>
          </InLens.Root>
        </div>
      </section>

      <section
        id="wormhole-radio"
        className="demo demo--signal"
        data-example="wormhole-radio"
        aria-labelledby="signal-title"
      >
        <header className="demo-copy signal-copy">
          <p>Channel ∞ · semantic parts</p>
          <h2 id="signal-title">Wormhole Radio</h2>
          <span>A horizontal scan beam broadcasts into a vertical portal.</span>
        </header>

        <div className="signal-stage">
          <InLens.Root as="figure" zoom={4.8} className="signal-root">
            <InLens.Image as="span" className="signal-source">
              <img
                src="/signal.svg"
                alt="Alien radio transmission with rings and waveform symbols"
              />
            </InLens.Image>

            <InLens.Lens as="span" className="signal-beam">
              <InLens.Magnified as="span" className="magnified signal-surface">
                <img src="/signal.svg" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <InLens.Panel as="aside" className="signal-portal">
              <InLens.Magnified className="magnified signal-surface">
                <img src="/signal.svg" alt="" />
              </InLens.Magnified>
              <span className="signal-frequency">141.12 MHz</span>
            </InLens.Panel>

            <span className="signal-ring signal-ring--one" aria-hidden="true" />
            <span className="signal-ring signal-ring--two" aria-hidden="true" />
            <figcaption>Tune the pointer until the transmission resolves.</figcaption>
          </InLens.Root>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
