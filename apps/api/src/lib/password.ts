/**
 * Compared against when the email is unknown, so both failure paths cost the same. A fixed bcrypt
 * hash of a throwaway string, so Worker start-up doesn't spend CPU hashing it.
 */
export const DUMMY_HASH = "$2b$10$gNDn3kypmNQmjLcCm3U.v.kpuaCbqP1TFOh3uocW5GvWqln9Ariei";
