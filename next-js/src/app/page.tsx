'use client';

import AsyncQueue from '@/utils/AsyncQueue';
import generateJoiningCode from '@/utils/generateJoiningCode';
import { useCallback, useRef, useState } from 'react';
import { RtcPairSocket } from 'rtc-pair-socket';
import styles from './page.module.css';
import generateProtocol from '@/utils/generateProtocol';

export default function Home() {
  const [msgQueue] = useState(new AsyncQueue<unknown>());
  const [step, setStep] = useState<number>(1);
  const [joiningCode, setJoiningCode] = useState<string>();
  const [spinner, setSpinner] = useState<boolean>(false);
  const [party, setParty] = useState<string>();
  const [socket, setSocket] = useState<RtcPairSocket>();
  const [number, setNumber] = useState<number>();
  const [result, setResult] = useState<string>();
  const [progress, setProgress] = useState<number>(0);
  const totalBytesRef = useRef(0);

  const handleHost = useCallback(async () => {
    // 128 bits of entropy
    const code = generateJoiningCode();
    setJoiningCode(code);
    setStep(2.1);

    await connect(code, 'alice');

    setStep(3);
  }, []);

  const handleJoin = useCallback(() => {
    setStep(2.2);
  }, []);

  const handleJoinSubmit = useCallback(async () => {
    if (joiningCode) {
      setSpinner(true);

      await connect(joiningCode, 'bob');

      setSpinner(false);
      setStep(3);
    }
  }, [joiningCode]);

  const handleSubmitNumber = useCallback(async () => {
    if (number) {
      setStep(4);

      const result = await mpcLargest(number);

      setStep(5);
      setResult(result);
    }
  }, [number]);

  const connect = useCallback(async (code: string, party: 'alice' | 'bob') => {
    setParty(party);

    const socket = new RtcPairSocket(code, party);

    setSocket(socket);

    socket.on('message', (msg: unknown) => {
      // Using a message queue instead of passing messages directly to the MPC
      // protocol ensures that we don't miss anything sent before we begin.
      msgQueue.push(msg);
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('open', resolve);
      socket.on('error', reject);
    });
  }, []);

  const mpcLargest = useCallback(
    async (value: number) => {
      if (!party) {
        alert('Party must be set');
        return;
      }

      if (!socket) {
        alert('Socket must be set');
        return;
      }

      const input = party === 'alice' ? { a: value } : { b: value };
      const otherParty = party === 'alice' ? 'bob' : 'alice';

      const protocol = await generateProtocol();

      const session = protocol.join(party, input, (to, msg) => {
        if (to !== otherParty) {
          alert('Unexpected party');
          return;
        }

        socket.send(msg);

        totalBytesRef.current += msg.byteLength;
        setProgress(progress => (progress += msg.byteLength));
      });

      msgQueue.stream((msg: unknown) => {
        if (!(msg instanceof Uint8Array)) {
          throw new Error('Unexpected message type');
        }

        session.handleMessage(otherParty, msg);

        totalBytesRef.current += msg.byteLength;
        setProgress(progress => (progress += msg.byteLength));
      });

      const output = await session.output();

      if (
        output === null ||
        typeof output !== 'object' ||
        typeof output.main !== 'number'
      ) {
        throw new Error('Unexpected output');
      }

      return output.main === 0
        ? 'equal'
        : (output.main === 1 && party === 'alice') ||
            (output.main === 2 && party === 'bob')
          ? 'larger'
          : 'smaller';
    },
    [party, socket],
  );

  const normalizeProgress = useCallback(() => {
    const TOTAL_BYTES = 248476;

    const percentage = Math.floor((progress / TOTAL_BYTES) * 100);

    // This allows it to start showing % when the MPC is actually started.
    if (percentage > 1) {
      return percentage;
    }

    return 0;
  }, [progress]);

  return (
    <div className={styles.app}>
      <div className={styles.header}>MPC Hello</div>

      <div className={styles['step-container']}>
        {step === 1 && (
          <div className={styles.step}>
            <div style={{ textAlign: 'left' }}>
              Welcome to the hello-world of MPC (
              <a
                className={styles.a}
                href="https://github.com/cedoor/mpc-cli/tree/main/packages/template-hello-next"
              >
                view source
              </a>
              ).
            </div>
            <div style={{ textAlign: 'left', marginTop: '1em' }}>
              To start, one party should click host. This will generate a code
              that the other party can use to join. It's an end-to-end encrypted
              P2P connection. There is no server.
            </div>
            <div style={{ textAlign: 'left', marginTop: '1em' }}>
              Once connected, both parties will enter a number. Each party will
              only be informed whether their number is the largest or not, but
              both numbers are kept cryptographically secret.
            </div>
            <div style={{ textAlign: 'left', marginTop: '1em' }}>
              This is just a simple example, but mpc-framework makes it easy to
              do this with any function.
            </div>
            <div>
              <button onClick={handleHost} className={styles.button}>
                Host
              </button>
              &nbsp;
              <button onClick={handleJoin} className={styles.button}>
                Join
              </button>
            </div>
          </div>
        )}

        {step === 2.1 && (
          <div className="step">
            <p>Joining code:</p>
            <div className={styles['code-box']}>{joiningCode}</div>
          </div>
        )}

        {step === 2.2 && (
          <div className="step">
            <div>
              <label>Enter host code:</label>
              <input
                onChange={event => setJoiningCode(event.target.value)}
                type="text"
              />
            </div>
            <div>
              <button onClick={handleJoinSubmit} className={styles.button}>
                Join
              </button>
            </div>
            {spinner && (
              <div className={styles['spinner-container']}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="step">
            <div>
              <label>Enter your number:</label>
              <input
                onChange={event => setNumber(parseInt(event.target.value))}
                type="number"
              />
            </div>
            <div>
              <button onClick={handleSubmitNumber} className={styles.button}>
                Submit
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step">
            <p>
              {normalizeProgress() < 1
                ? 'Waiting...'
                : `${normalizeProgress()}%`}
            </p>
            <div className={styles['spinner-container']}>
              <div className={styles.spinner}></div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step">
            <h2>
              <span>Your number is {result}!</span>
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
