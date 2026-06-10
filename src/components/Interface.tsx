import { useState, type FormEvent } from 'react'
import { scrollToPage } from '../scrollBus'

function Marquee({ text }: { text: string }) {
  const chunk = Array(6).fill(text).join('  ')
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        <span>{chunk}</span>
        <span>{chunk}</span>
      </div>
    </div>
  )
}

const MENU = [
  {
    name: 'KAIJU SHOYU',
    desc: '48-hour chicken & dashi, smoked soy egg, charred negi, bamboo',
    price: '14 €',
  },
  {
    name: 'VOLCANO TONKOTSU',
    desc: 'Pork-bone broth, house chili oil, double chashu, black garlic',
    price: '16 €',
  },
  {
    name: 'NEON PAITAN',
    desc: 'Creamy chicken paitan, yuzu zest, pink pickled onion, shio tare',
    price: '15 €',
  },
  {
    name: 'MIDNIGHT GOJIRA',
    desc: 'Vegan. Black-garlic mushroom broth, crispy tofu, sesame storm',
    price: '13 €',
  },
]

function Newsletter() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return <p className="newsletter__done">Domo arigato ✓</p>
  }

  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <input type="email" required placeholder="you@email.com" aria-label="Email address" />
      <button type="submit">Join the slurp list</button>
    </form>
  )
}

export default function Interface() {
  return (
    <div className="interface">
      {/* 0 — Hero */}
      <section className="section section--center section--hero">
        <p className="tagline">神 Ramen bar · Tokyo soul, Lisbon heat</p>
        <h1 className="hero-title">
          Slurp the
          <br />
          <span className="neon">impossible</span>.
        </h1>
        <p className="hero-sub">
          Twelve stools hidden in Bairro Alto. Broth that takes two days. Nights that take no
          prisoners.
        </p>
        <button className="cta" onClick={() => scrollToPage(2)}>
          See the bowls ↓
        </button>
        <div className="scroll-hint">
          <span className="scroll-hint__line" />
          <span className="scroll-hint__label">scroll</span>
        </div>
      </section>

      {/* 1 — Manifesto */}
      <section className="section section--left" data-num="01">
        <p className="kicker">01 — Manifesto</p>
        <h2>
          Broth is a<br />
          48-hour <span className="accent">story</span>.
        </h2>
        <p className="body">
          We start the pot on Sunday so Tuesday tastes like thunder. Bones, kombu, fire and
          patience — nothing else gets in. If a shortcut exists, we have already refused it. You
          don't rush a kaiju; you feed it time.
        </p>
        <Marquee text="48 HOURS — ONE POT — NO MERCY —" />
      </section>

      {/* 2 — Menu */}
      <section className="section section--top" data-num="02">
        <p className="kicker">02 — The Bowls</p>
        <h2>
          Four <span className="accent">signatures</span>.
        </h2>
        <ul className="menu">
          {MENU.map((item) => (
            <li key={item.name}>
              <div className="menu__row">
                <strong>{item.name}</strong>
                <span className="menu__price">{item.price}</span>
              </div>
              <p>{item.desc}</p>
            </li>
          ))}
        </ul>
        <p className="hint">→ hover the bowls</p>
      </section>

      {/* 3 — The Bar */}
      <section className="section section--left" data-num="03">
        <p className="kicker">03 — The Bar</p>
        <h2>
          Twelve stools.
          <br />
          One <span className="accent">counter</span>.
        </h2>
        <p className="body">
          No tables, no corners to hide in. You sit at the steel, you watch the flame, you hear
          the ladle hit the pot. Sake highballs, frozen Asahi, a vinyl deck that only knows city
          pop after midnight. The seat is the show.
        </p>
      </section>

      {/* 4 — Chef */}
      <section className="section section--left" data-num="04">
        <p className="kicker">04 — The Chef</p>
        <h2>
          One chef. One pot.
          <br />
          Zero <span className="accent">shortcuts</span>.
        </h2>
        <p className="body">
          Chef Rui "Kaiju" Tanaka-Mendes cooked nine years in Fukuoka before dragging his pot to
          Lisbon. He tastes every batch at hour 12, 24, 36 and 47 — and throws away anything that
          doesn't roar.
        </p>
        <div className="stats">
          <div>
            <strong>48h</strong>
            <span>broth</span>
          </div>
          <div>
            <strong>12</strong>
            <span>seats</span>
          </div>
          <div>
            <strong>2</strong>
            <span>sittings</span>
          </div>
        </div>
      </section>

      {/* 5 — Reservations */}
      <section className="section section--center" data-num="05">
        <Marquee text="BOOK A STOOL — BOOK A STOOL —" />
        <p className="kicker">05 — Reservations</p>
        <h2>
          Claim your <span className="accent">stool</span>.
        </h2>
        <p className="body body--center">
          Two sittings a night: 18:30 and 21:30. Twelve seats each. Walk-ins fight for the rest.
        </p>
        <div className="cta-row">
          <a className="cta cta--big" href="mailto:book@kaijuramen.com">
            book@kaijuramen.com
          </a>
          <a className="cta" href="tel:+351210000088">
            +351 21 000 0088
          </a>
        </div>
      </section>

      {/* 6 — Footer */}
      <section className="section section--footer">
        <div className="footer-marquee" aria-hidden="true">
          <div className="footer-marquee__track">
            <span>OPEN LATE — OPEN LATE — OPEN LATE — OPEN LATE — </span>
            <span>OPEN LATE — OPEN LATE — OPEN LATE — OPEN LATE — </span>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <h3>Find the den</h3>
            <address>
              Rua da Atalaia 88
              <br />
              Bairro Alto
              <br />
              1200-041 Lisboa
            </address>
            <table className="hours">
              <tbody>
                <tr>
                  <td>Tue — Sun</td>
                  <td>18:00 — 02:00</td>
                </tr>
                <tr>
                  <td>Mon</td>
                  <td>closed (pot day)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="footer-col">
            <h3>Follow the beast</h3>
            <ul className="socials">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer">
                  Instagram <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer">
                  TikTok <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <a href="https://open.spotify.com" target="_blank" rel="noreferrer">
                  Midnight playlist <span aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Slurp list</h3>
            <p className="footer-note">
              One email a month: secret bowls, guest chefs, late-night drops. No spam, no filler —
              like the broth.
            </p>
            <Newsletter />
          </div>
        </div>

        <div className="footer-bottom">
          <span>© KAIJU RAMEN 2026</span>
          <span>Lisboa</span>
          <span>"no MSG, all soul"</span>
        </div>
      </section>
    </div>
  )
}
