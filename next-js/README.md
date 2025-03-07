# mpc-hello with NextJS (client <> client)

This is a template repository designed to be the hello-world of
[mpc-framework](https://github.com/voltrevo/mpc-framework).

It uses [summon](https://github.com/voltrevo/summon) for circuit generation
and [emp-wasm-backend](https://github.com/voltrevo/emp-wasm-backend) for
secure 2PC.

It's a minimal web app where users can make 1-to-1 connections with each other
and compute the larger of two numbers, built with Next.js.

- 250 sloc
- Simple frontend
- P2P end-to-end encrypted communication
- Circuit code included via ordinary project files

Below are other examples of mpc-hello applications you may want to explore:

- [**Client-Client**](../client-client)
- [**Client-Server**](../client-server)
- [**Server-Server**](../server-server)

## Running Locally

```sh
npm install
npm run dev
```

### Setup the progress bar

By default a total bytes value is hardcoded in the template. 
```javascript
const TOTAL_BYTES = 248476;
```

To get an accurate progress you would need to run your MPC app and log the `totalBytesRef` value, and update the `TOTAL_BYTES`:
```javascript
totalBytesRef.current += msg.byteLength;
console.log('Total bytes exchanged', totalBytesRef.current);
```

## License

This is a template repository. You are free to use it as a starting point for
your own work without restriction. You may modify it, distribute it, and apply
your own licensing terms to your derived work as you see fit. This software is
provided "AS IS" without warranty of any kind, as described by the MIT license.
