import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ message: "Référence de transaction manquante" }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ message: "Clé secrète non configurée" }, { status: 500 });
    }

    // Appeler l'API de Paystack pour vérifier la transaction
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const data = await paystackResponse.json();

    if (data.status && data.data.status === "success") {
      // Le paiement est confirmé comme un succès par Paystack
      // Optionnel : Vous pouvez également mettre à jour la BDD ici si ce n'est pas déjà fait par le Webhook
      return NextResponse.json({ message: "Paiement vérifié avec succès", data: data.data }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Paiement non valide ou en attente" }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification :", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}
