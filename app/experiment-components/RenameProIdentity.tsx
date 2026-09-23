import styles from "./RenameProIdentity.module.css";

/** Shared, font-independent mark for the Rename Pro browser experiment. */
export default function RenameProIdentity({ compact = false }: { compact?: boolean }) {
  return <div className={`${styles.identity} ${compact ? styles.compact : ""}`}>
    <svg className={styles.mark} viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Rename Pro RP monogram">
      <rect x="1" y="1" width="118" height="118" rx="3" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <path transform="translate(-5 0)" fill="currentColor" fillRule="evenodd" d="M19 24H43C57 24 64 32 64 44C64 53 60 59 53 62L67 84H51L38 64H33V84H19ZM33 36V52H42C48 52 51 49 51 44C51 39 48 36 42 36Z M69 24H91C104 24 111 32 111 44C111 57 103 64 90 64H83V84H69ZM83 36V52H90C95 52 98 49 98 44C98 39 95 36 90 36Z" />
      <path d="M20 99H98M91 92L98 99L91 106" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
    </svg>
    <span className={styles.caption} aria-label="old name becomes new name"><span>old_name</span><span aria-hidden="true">→</span><span>new_name</span></span>
  </div>;
}
