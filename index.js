
import {
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    getMint,
    createMintToCheckedInstruction,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    createAssociatedTokenAccountInstruction,
    createInitializeNonTransferableMintInstruction,
    transferChecked
  } from "@solana/spl-token";
  import { keypair, payer } from "./keypair.js";
  import { connection } from "./connection.js";
  
  
  //Basic info needed for creation
  const tokenName = 'Non Transferable Token';
  const tokenSymbol = 'NTT';
  const tokenExternalUrl = 'https://earn.christex.foundation/';
  
  
  // setting up the mint address
  const mint = Keypair.generate();
  const decimals = 1;
  const supply = 1;

  // Creating the metadata object
  const metadata = {
    mint: mint.publicKey,
    name: tokenName,
    symbol: tokenSymbol,
    uri: tokenExternalUrl
  };
  
  //calculating the space needed for the metadata
  const mintAccNonTransferable = getMintLen([ExtensionType.NonTransferable])
  
  //rent required for mint account 
  const lamports = await connection.getMinimumBalanceForRentExemption(mintAccNonTransferable);
  
  
  //Building the instructions below 
  
  const createAccountSP = SystemProgram.createAccount({
    // call System Program to create new account
    fromPubkey: payer,
    newAccountPubkey: mint.publicKey,
    space: mintAccNonTransferable,
    programId: TOKEN_2022_PROGRAM_ID,
    lamports
  });

  const initializeNonTransferableMint = createInitializeNonTransferableMintInstruction(
    //initializing the NonTransferableMintInstruction
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID
  )
  
  
  const initializeMint = createInitializeMintInstruction(
    //initializing the mint Account
    mint.publicKey,
    decimals,
    payer,
    null,
    TOKEN_2022_PROGRAM_ID,
  );
  
  

  //create ATA and mint the token to myself not transferable after minting.
  const ata = await getAssociatedTokenAddress(mint.publicKey, payer, false, TOKEN_2022_PROGRAM_ID);
  const createATA = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    payer,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID,
  );
  
  const mintInstruction = createMintToCheckedInstruction(
    mint.publicKey,
    ata,
    payer,
    supply,
    decimals,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  
  
  
  // Add instructions to new transaction
  const transaction = new Transaction().add(
    createAccountSP,
    initializeNonTransferableMint,
    initializeMint,
    createATA,
    mintInstruction,
  );
  
  
  // Send transaction
  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keypair, mint], // Signers
  );
  
  // logging the mint account and mettadaa stored in the mint Account
  
  // Fetching the mint
  const mintDetails = await getMint(connection, mint.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
  console.log('Mint is ->', mintDetails);
  console.log("Non transferable token created and minted to myself");
  
  console.log(
    "\nTransaction Sig :",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
  );


  //attempting to transfer the token

  // CREATING DESTINATION ACCOUNT AND ATA FOR TRANSFER AND HOLDING THE TOKEN
console.log('Creating a destination account...\n\n')
const destinationKeypair = Keypair.generate()
const destATA = getOrCreateAssociatedTokenAccount(connection, keypair, mint.publicKey, destinationKeypair.publicKey, undefined, undefined, undefined, TOKEN_2022_PROGRAM_ID)


// TRY TRANSFER
console.log('Attempting to transfer non-transferable mint...')
try {
  let txhash = await transferChecked(
    connection, 
    keypair, 
    ata,
    mint.publicKey, 
    destATA, 
    payer, 
    1, 
    decimals 
  );

} catch (e) {
  console.log(
    'This transfer is failing because the mint is non-transferable',
    // e
  )
}