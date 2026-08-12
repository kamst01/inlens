import Image from "next/image";
import { InLens } from "@inlens/next";

export default function Page() {
  return (
    <main>
      <header className="site-header">
        <p className="eyebrow">@inlens/next · server-authored oddities</p>
        <h1>The atlas refuses to stay still.</h1>
        <p className="lede">
          Three App Router Server Component compositions, each handing its finished markup through
          InLens&apos;s single private runtime.
        </p>
        <nav aria-label="Example variants">
          <a href="#astral-orrery">01 Orrery</a>
          <a href="#radioactive-receipt">02 Receipt</a>
          <a href="#dream-cartography">03 Shards</a>
        </nav>
      </header>

      <section
        id="astral-orrery"
        className="demo demo--orrery"
        data-example="astral-orrery"
        aria-labelledby="orrery-title"
      >
        <header className="demo-copy">
          <p>Plate 01 · Lens + Panel × 2 + Tracker</p>
          <h2 id="orrery-title">Astral Orrery</h2>
          <span>Two observation ports orbit one server-rendered star chart.</span>
        </header>

        <div className="orrery-stage">
          <InLens.Root as="figure" zoom={3.4} className="orrery-root">
            <InLens.Image as="span" className="orrery-source">
              <Image
                src="/astral-map.svg"
                fill
                sizes="(max-width: 720px) 88vw, 560px"
                loading="eager"
                alt="Illustrated astral chart with planets, orbital paths, and constellations"
              />
            </InLens.Image>

            <InLens.Tracker className="orrery-tracker" />

            <InLens.Lens as="span" className="orrery-lens">
              <InLens.Magnified as="span" className="magnified orrery-magnified">
                <Image src="/astral-map.svg" fill sizes="1900px" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <InLens.Panel as="aside" className="orrery-panel orrery-panel--moon">
              <InLens.Magnified className="magnified orrery-magnified">
                <Image src="/astral-map.svg" fill sizes="1900px" alt="" />
              </InLens.Magnified>
              <span className="orrery-readout">OBJECT 07 / LOCKED</span>
            </InLens.Panel>

            <InLens.Panel as="aside" className="orrery-panel orrery-panel--comet">
              <InLens.Magnified className="magnified orrery-magnified">
                <Image src="/astral-map.svg" fill sizes="1900px" alt="" />
              </InLens.Magnified>
            </InLens.Panel>

            <span className="orrery-ring orrery-ring--one" aria-hidden="true" />
            <span className="orrery-ring orrery-ring--two" aria-hidden="true" />
            <figcaption>Sidereal calibration / epoch 2091.4</figcaption>
          </InLens.Root>
        </div>
      </section>

      <section
        id="radioactive-receipt"
        className="demo demo--receipt"
        data-example="radioactive-receipt"
        aria-labelledby="receipt-title"
      >
        <header className="demo-copy receipt-copy">
          <p>Bio/scan–2097 · responsive slit</p>
          <h2 id="receipt-title">Radioactive Receipt</h2>
          <span>The vertical beam becomes horizontal at the mobile breakpoint.</span>
        </header>

        <div className="receipt-stage">
          <InLens.Root zoom={2.8} className="receipt-root">
            <InLens.Image className="receipt-source">
              <Image
                src="/spectral-specimen.svg"
                fill
                sizes="(max-width: 720px) 92vw, 1080px"
                alt="Panoramic fluorescent specimen of cells, spores, and handwritten marks"
              />
            </InLens.Image>

            <InLens.Tracker className="receipt-tracker" />

            <InLens.Lens className="receipt-beam">
              <InLens.Magnified className="magnified receipt-magnified">
                <Image src="/spectral-specimen.svg" fill sizes="3000px" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <InLens.Panel as="aside" className="receipt-output">
              <InLens.Magnified className="magnified receipt-magnified">
                <Image src="/spectral-specimen.svg" fill sizes="3000px" alt="" />
              </InLens.Magnified>
              <span className="receipt-code">RESULT: BEAUTIFULLY INCONCLUSIVE</span>
            </InLens.Panel>
          </InLens.Root>
        </div>
      </section>

      <section
        id="dream-cartography"
        className="demo demo--shards"
        data-example="dream-cartography"
        aria-labelledby="shards-title"
      >
        <header className="demo-copy shards-copy">
          <p>Folio 03 · Lens × 3</p>
          <h2 id="shards-title">Shattered Dream Cartography</h2>
          <span>Three stained-glass lenses disagree about the same impossible city.</span>
        </header>

        <div className="shards-stage">
          <InLens.Root as="figure" zoom={2.25} className="shards-root">
            <InLens.Image as="span" className="shards-source">
              <Image
                src="/impossible-city.svg"
                fill
                sizes="(max-width: 720px) 92vw, 820px"
                alt="Surreal city map with upside-down towers, rivers, and floating roads"
              />
            </InLens.Image>

            <InLens.Lens as="span" className="shard shard--cyan">
              <InLens.Magnified as="span" className="magnified shard-image shard-image--cyan">
                <Image src="/impossible-city.svg" fill sizes="1850px" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <InLens.Lens as="span" className="shard shard--rose">
              <InLens.Magnified as="span" className="magnified shard-image shard-image--rose">
                <Image src="/impossible-city.svg" fill sizes="1850px" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <InLens.Lens as="span" className="shard shard--gold">
              <InLens.Magnified as="span" className="magnified shard-image shard-image--gold">
                <Image src="/impossible-city.svg" fill sizes="1850px" alt="" />
              </InLens.Magnified>
            </InLens.Lens>

            <span className="shards-crack shards-crack--one" aria-hidden="true" />
            <span className="shards-crack shards-crack--two" aria-hidden="true" />
            <figcaption>Municipal plan, authenticated by nobody.</figcaption>
          </InLens.Root>
        </div>
      </section>
    </main>
  );
}
