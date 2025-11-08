#!/bin/bash
# Ce script recharge le contexte du projet dans Claude CLI

if [ ! -f project_brain.md ]; then
  echo "⚠️  Aucun fichier project_brain.md trouvé à la racine du projet."
  exit 1
fi

echo "📦 Chargement du contexte dans Claude..."
cat project_brain.md | claude "Voici le contexte complet du projet. Charge-le et sois prêt à continuer le développement à partir de cet état."
echo "✅ Contexte chargé avec succès."
