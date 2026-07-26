import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // Récupérer le corps brut de la requête (nécessaire pour la vérification de la signature)
    const rawBody = await req.text();
    
    // Récupérer la signature envoyée par Paystack
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ message: "Signature manquante" }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ message: "Clé secrète non configurée sur le serveur" }, { status: 500 });
    }

    // Créer un hash avec la clé secrète et le corps brut
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    // Vérifier si la signature correspond
    if (hash !== signature) {
      return NextResponse.json({ message: "Signature invalide" }, { status: 401 });
    }

    // Parser le JSON pour récupérer les données de l'événement
    const event = JSON.parse(rawBody);

    // Traiter les événements spécifiques de Paystack
    if (event.event === "charge.success") {
      const data = event.data;
      const { reference, metadata, customer, amount } = data;
      
      // TODO: Logique pour activer l'abonnement VIP
      // 1. Rechercher l'utilisateur dans votre base de données (ex: Supabase) avec customer.email
      // 2. Mettre à jour le statut de l'utilisateur à "VIP"
      // 3. Enregistrer la transaction dans la base de données
      
      console.log(`✅ Webhook Paystack: Paiement réussi pour ${customer.email} (Réf: ${reference})`);
    }

    // Répondre toujours avec 200 OK à Paystack pour confirmer la réception
    return NextResponse.json({ message: "Webhook reçu avec succès" }, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur Webhook Paystack :", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}
