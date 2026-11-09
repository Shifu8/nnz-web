import styles from "./FourgoCreatorFriends.module.css";

export default function FourgoCreatorFriends({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.friends} ${className}`} aria-hidden="true">
      <div className={styles.sparkle} data-creator-sparkle>
        <svg viewBox="0 0 70 80" fill="none">
          <path d="m35 5 9 23 21 10-23 10-8 26-9-25L5 39l21-10Z" fill="#f29bce" stroke="#171711" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={styles.cloud} data-creator-character>
        <svg viewBox="0 0 280 390" fill="none">
          <g stroke="#171711" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m125 224-3 102-20 33m42-135 26 58-23 47 5 31" />
            <path d="M104 358c-8-24-32-19-34 1-1 12 17 13 34 10l20-2-2-13-10 5m39 1c7-21 20-17 25-5 3 9-2 14-24 15l-13-1 1-12 11 3" fill="#171711" />
            <path d="m143 232 16 47-22 44 2 34M114 229l-2 99-18 24" />
            <path d="M45 204c-22-1-31-19-22-36-13-14-7-33 11-39-7-18 3-33 21-36-4-20 9-33 28-33 1-17 14-27 31-24l-2-12 12 11 13-18 5 17 18-8-4 16c23-5 39 8 40 26 20-1 34 14 31 32 20 5 30 24 21 41 20 8 23 30 8 43 13 14 4 33-14 36-8 16-27 17-40 8-14 13-32 13-44 2-14 10-31 9-43-3-16 12-36 7-41-7-10 4-24 1-29-11Z" fill="#fffef7" />
            <path d="m67 87 8-5m103-22 8 7M29 157l7-5" strokeWidth="2" />
            <ellipse cx="118" cy="127" rx="13" ry="22" fill="white" />
            <ellipse cx="146" cy="127" rx="13" ry="22" fill="white" />
            <ellipse cx="122" cy="132" rx="6" ry="13" fill="#171711" stroke="none" />
            <ellipse cx="149" cy="132" rx="6" ry="13" fill="#171711" stroke="none" />
            <path d="M120 157q13 15 26-1" />
            <path d="m112 154-6 3m45-3 6 3" strokeWidth="2" />
          </g>
        </svg>
      </div>
      <div className={styles.sun} data-creator-character>
        <svg viewBox="0 0 285 300" fill="none">
          <g stroke="#171711" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m110 200-22 47-24-8m97-30 29 48 30 4" />
            <path d="M69 240c-22-3-31 12-20 26 7 10 18 5 25-9l5-12-10-5Zm148 19c12-20 31-13 34 1 1 9-11 13-36 9l-12-4 5-10 9 4Z" fill="#171711" />
            <path d="m139 20 14 43 31-32-1 47 42-13-18 39 46 5-36 29 36 25-46 9 20 39-44-14 1 45-31-32-16 43-15-42-33 31 3-45-44 13 21-39-45-8 36-27-37-27 46-5-20-41 45 14-2-45 32 34Z" fill="#fffef7" />
            <ellipse cx="120" cy="116" rx="12" ry="21" transform="rotate(-9 120 116)" fill="white" />
            <ellipse cx="149" cy="113" rx="12" ry="21" transform="rotate(-9 149 113)" fill="white" />
            <ellipse cx="124" cy="120" rx="5.5" ry="12" transform="rotate(-9 124 120)" fill="#171711" stroke="none" />
            <ellipse cx="153" cy="117" rx="5.5" ry="12" transform="rotate(-9 153 117)" fill="#171711" stroke="none" />
            <path d="M119 146q17 21 35-5" />
            <path d="m165 135 9 3-4 9m-58-5-7 4" strokeWidth="2" />
            <ellipse cx="152" cy="168" rx="7" ry="11" transform="rotate(-19 152 168)" fill="#171711" />
          </g>
        </svg>
      </div>
      <svg className={styles.littleSpark} viewBox="0 0 50 50" fill="none">
        <path d="m25 3 5 16 16 6-16 5-5 17-6-17-16-5 16-6Z" fill="#f29bce" stroke="#171711" strokeWidth="2" />
      </svg>
    </div>
  );
}
