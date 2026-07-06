import { getLang }      from '../i18n.js';
import { isSuperAdmin } from '../auth.js';

export function renderAide(container) {
  const lang = getLang();
  container.innerHTML = lang === 'en' ? _en() : _fr();
}

/* ── CONTENU FRANÇAIS ─────────────────────────────────────── */
function _fr() { return `
<div class="aide-wrap">

  <div class="aide-hero">
    <i class="bi bi-heart-pulse-fill"></i>
    <div>
      <h2>Guide d'utilisation</h2>
      <p>St Hugh's Anglican Home, Système de Gestion Médicale</p>
    </div>
  </div>

  <div class="aide-grid">

    <!-- GUIDE VIDÉO -->
    <div class="aide-card aide-card-full">
      <div class="aide-card-title"><i class="bi bi-play-circle-fill"></i> Guide vidéo</div>
      <p>Regardez cette présentation animée pour découvrir les principales fonctionnalités de l'application St Hugh's Medical en quelques minutes.</p>
      <div class="aide-video-wrap">
        <iframe
          src="Vid%C3%A9o/vid%C3%A9o.html"
          class="aide-video"
          title="Guide vidéo St Hugh's Medical"
          loading="lazy"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <!-- CONNEXION -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-shield-lock-fill"></i> Connexion</div>
      <img src="src/composants/01-connexion.png" alt="Connexion" class="aide-illus">
      <p>Entrez votre <strong>adresse email</strong> et votre <strong>mot de passe</strong> fournis par votre administrateur. Si vous avez oublié votre mot de passe, contactez l'administrateur système.</p>
      <div class="aide-tip"><i class="bi bi-info-circle-fill"></i> Votre session reste active après fermeture de l'onglet. Déconnectez-vous toujours si vous utilisez un ordinateur partagé.</div>
    </div>

    <!-- NAVIGATION -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-grid-1x2-fill"></i> Navigation</div>
      <img src="src/composants/02-navigation.png" alt="Navigation" class="aide-illus">
      <p>Le menu à gauche donne accès à toutes les sections. Sur mobile, appuyez sur l'icône ☰ en haut à gauche.</p>
      <table class="aide-table">
        <tr><td><i class="bi bi-grid-1x2-fill"></i></td><td><strong>Tableau de bord</strong></td><td>Vue d'ensemble + urgences du jour</td></tr>
        <tr><td><i class="bi bi-people-fill"></i></td><td><strong>Résidents</strong></td><td>Dossiers des résidents</td></tr>
        <tr><td><i class="bi bi-person-badge-fill"></i></td><td><strong>Médecins</strong></td><td>Médecins traitants</td></tr>
        <tr><td><i class="bi bi-capsule-pill"></i></td><td><strong>Traitements</strong></td><td>Médicaments, alertes & catalogue</td></tr>
        <tr><td><i class="bi bi-journal-medical"></i></td><td><strong>Consultations</strong></td><td>Historique des visites</td></tr>
        <tr><td><i class="bi bi-calendar3"></i></td><td><strong>Rendez-vous</strong></td><td>Calendrier + urgences</td></tr>
        <tr><td><i class="bi bi-list-ol"></i></td><td><strong>Planification</strong></td><td>Rotation des visites médicales 2×/semaine</td></tr>
        <tr><td><i class="bi bi-person-walking"></i></td><td><strong>Visites</strong></td><td>Visites des familles et proches (enregistrement, suivi)</td></tr>
        <tr><td><i class="bi bi-box-arrow-right"></i></td><td><strong>Sorties</strong></td><td>Archive des sorties temporaires, départs et décès</td></tr>
        <tr><td><i class="bi bi-bag-fill"></i></td><td><strong>Courses</strong></td><td>Sorties commissions des résidents autonomes, heures départ/retour, articles achetés</td></tr>
        <tr><td><i class="bi bi-balloon-heart-fill"></i></td><td><strong>Anniversaires</strong></td><td>Célébrations des résidents, alertes automatiques</td></tr>
        <tr><td><i class="bi bi-bell-fill"></i></td><td><strong>Alertes</strong></td><td>Notifications médicaments / anniversaires</td></tr>
        <tr><td><i class="bi bi-bar-chart-fill"></i></td><td><strong>Statistiques</strong></td><td>Graphiques d'activité</td></tr>
        <tr><td><i class="bi bi-person-circle"></i></td><td><strong>Mon profil</strong></td><td>Vos informations de compte, bouton de déconnexion</td></tr>
      </table>
    </div>

    <!-- DOSSIER RÉSIDENT -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-person-vcard-fill"></i> Dossier d'un résident</div>
      <img src="src/composants/03-dossier-resident.png" alt="Dossier résident" class="aide-illus">
      <p>Depuis la page <strong>Résidents</strong>, cliquez sur une ligne pour ouvrir le dossier complet. Il contient 5 onglets :</p>
      <div class="aide-tabs-preview">
        <div class="aide-tab-item"><strong>Infos</strong><span>Médecin traitant, groupe sanguin, taille, mobilité, allergies, antécédents, et en bas : historique des vacances et historique des courses si disponibles</span></div>
        <div class="aide-tab-item"><strong>Contacts</strong><span>Famille à appeler en cas d'urgence, le contact principal est indiqué</span></div>
        <div class="aide-tab-item"><strong>Traitements</strong><span>Médicaments actifs avec jours restants et alertes de couleur</span></div>
        <div class="aide-tab-item"><strong>Consultations</strong><span>Historique des visites médicales avec lien vers les ordonnances</span></div>
        <div class="aide-tab-item"><strong>RDV</strong><span>Rendez-vous passés et à venir pour ce résident</span></div>
      </div>
      <div class="aide-tip" style="margin-top:.75rem"><i class="bi bi-luggage-fill"></i> <strong>Historique des vacances :</strong> chaque sortie vacances passée (date départ, date retour, motif) apparaît automatiquement dans l'onglet Infos lorsque le résident revient au foyer.</div>
      <div class="aide-tip" style="margin-top:.5rem"><i class="bi bi-bag-fill"></i> <strong>Historique des courses :</strong> toutes les sorties commissions enregistrées pour ce résident (date, heure départ/retour, articles achetés) sont visibles dans l'onglet Infos, pour les résidents autonomes uniquement.</div>
    </div>

    <!-- COURSES -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-bag-fill"></i> Courses & Commissions</div>
      <img src="src/composants/04-courses-commissions.png" alt="Courses & Commissions" class="aide-illus">
      <p>La page <strong>Courses</strong> est réservée aux <strong>résidents autonomes</strong> (<em>mobilité = Autonome</em>). Elle permet de noter chaque sortie pour faire des commissions.</p>
      <ol class="aide-steps">
        <li>Cliquez sur <strong>Enregistrer une sortie</strong></li>
        <li>Sélectionnez le résident autonome (seuls les résidents actifs avec mobilité "Autonome" apparaissent dans la liste)</li>
        <li>Indiquez la date, l'heure de départ et les articles à acheter (facultatif)</li>
        <li>Cliquez sur <strong>Enregistrer</strong></li>
      </ol>
      <p style="margin-top:.5rem">Quand le résident revient :</p>
      <ol class="aide-steps" start="5">
        <li>Cliquez sur <strong>Retour</strong> en face de sa sortie</li>
        <li>Confirmez l'heure de retour (pré-remplie avec l'heure actuelle)</li>
      </ol>
      <div class="aide-col3">
        <div style="padding:.6rem .8rem;background:rgba(37,99,235,.06);border-radius:var(--radius-sm);border-left:3px solid #2563eb">
          <div style="font-weight:700;font-size:.82rem;color:var(--teal-dark);margin-bottom:.2rem"><span class="badge badge-teal">Planifiée</span></div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Sortie enregistrée, heure de départ non encore renseignée</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(245,158,11,.07);border-radius:var(--radius-sm);border-left:3px solid #f59e0b">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-amber-fg);margin-bottom:.2rem"><span class="badge badge-attente">Dehors</span></div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Résident sorti, pas encore revenu</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(22,163,74,.06);border-radius:var(--radius-sm);border-left:3px solid #16a34a">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-green-fg);margin-bottom:.2rem"><span class="badge badge-actif">Rentré(e)</span></div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Résident de retour, sortie terminée</p>
        </div>
      </div>
      <div class="aide-tip">
        <i class="bi bi-info-circle-fill"></i> L'historique complet des courses d'un résident est également visible dans son <strong>dossier</strong> (onglet Infos) et dans l'<strong>export PDF</strong>.
      </div>
    </div>

    <!-- SORTIES / DÉCÈS -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-box-arrow-right"></i> Sorties</div>
      <img src="src/composants/09-sorties-deces.png" alt="Sorties" class="aide-illus">
      <p>Depuis le <strong>dossier d'un résident actif</strong>, le bouton de sortie permet d'enregistrer l'une des 3 situations suivantes :</p>
      <div class="aide-col3-lg">
        <div style="padding:.75rem;background:rgba(37,99,235,.06);border-radius:var(--radius-sm);border-left:3px solid #2563eb">
          <div style="font-weight:700;color:var(--tint-blue-fg);margin-bottom:.3rem"><i class="bi bi-luggage-fill"></i> Vacances / Sortie temporaire</div>
          <p style="font-size:.82rem;margin:0">Le résident revient. Il reste <strong>actif</strong> avec le badge "En vacances". Bouton <strong>Retour au foyer</strong> pour le réintégrer. <em>Accessible à tous les rôles.</em></p>
        </div>
        <div style="padding:.75rem;background:rgba(107,114,128,.08);border-radius:var(--radius-sm);border-left:3px solid #6b7280">
          <div style="font-weight:700;color:var(--tint-gray-fg);margin-bottom:.3rem"><i class="bi bi-door-open-fill"></i> Départ définitif</div>
          <p style="font-size:.82rem;margin:0">La famille reprend le résident. Il passe en <strong>archivé</strong>, visible dans le filtre "Partis". <em>Super Admin uniquement.</em></p>
        </div>
        <div style="padding:.75rem;background:rgba(153,27,27,.06);border-radius:var(--radius-sm);border-left:3px solid #991b1b">
          <div style="font-weight:700;color:var(--tint-red-fg);margin-bottom:.3rem"><span style="font-size:1rem">✝</span> Décès</div>
          <p style="font-size:.82rem;margin:0">Le résident est archivé dans le filtre "Décédés". Toutes ses données sont conservées. Cause du décès facultative. <em>Super Admin uniquement.</em></p>
        </div>
      </div>
      <div class="aide-tip" style="margin-bottom:.6rem"><i class="bi bi-lock-fill"></i> <strong>Profil archivé (décédé ou parti) :</strong> Le dossier passe en lecture seule, plus de nouvelles consultations, traitements ou RDV possibles. Le PDF généré est différent et indique clairement le statut.</div>
      <div class="aide-tip" style="margin-bottom:.6rem">
        <i class="bi bi-luggage-fill"></i> <strong>Retour de vacances :</strong> lorsque vous cliquez <em>Retour au foyer</em>, la période de vacances (date de départ, date de retour, motif) est automatiquement sauvegardée dans l'historique du résident.
      </div>
      <div class="aide-tip"><i class="bi bi-info-circle-fill"></i> Les résidents en vacances restent dans la liste principale avec un badge bleu. Décédés et partis n'apparaissent que dans la page <strong>Sorties</strong> et leurs filtres dédiés.</div>
    </div>

    <!-- VISITES -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-person-walking"></i> Visites</div>
      <img src="src/composants/08-visites-familles.png" alt="Visites familles & proches" class="aide-illus">
      <p>La page <strong>Visites</strong> gère toutes les visites des familles et proches :</p>
      <ol class="aide-steps">
        <li>Cliquez <strong>Enregistrer une visite</strong></li>
        <li>Renseignez le visiteur principal : prénom, nom, téléphone, relation (facultatif)</li>
        <li>Sélectionnez le résident visité et indiquez le nombre de personnes</li>
        <li>Si plus d'1 personne, ajoutez les noms des autres visiteurs (un seul numéro de téléphone nécessaire)</li>
        <li>Définissez la date et l'heure d'arrivée, cochez <strong>Planifier</strong> pour une visite future</li>
        <li>L'heure de départ peut être renseignée plus tard en cliquant <strong>Fin de visite</strong></li>
      </ol>
      <p style="margin-top:.5rem">Les statuts : <span class="badge badge-planifie">Planifiée</span> → <span class="badge" style="background:var(--tint-green-bg);color:var(--tint-green-fg)">En cours</span> → <span class="badge badge-confirme">Terminée</span>. Le badge dans le menu indique le nombre de visites du jour.</p>
      <div class="aide-tip" style="margin-top:.75rem">
        <i class="bi bi-list-ol"></i> <strong>Planification :</strong> la page <strong>Planification</strong> gère la rotation des visites médicales (2×/semaine). Les résidents y sont triés par score de priorité pour optimiser chaque passage du médecin.
      </div>
    </div>

    <!-- ANNIVERSAIRES -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-balloon-heart-fill"></i> Anniversaires</div>
      <img src="src/composants/06-anniversaires.png" alt="Anniversaires" class="aide-illus">
      <p>La page <strong>Anniversaires</strong> affiche les anniversaires des résidents classés par urgence :</p>
      <ul class="aide-list">
        <li><span class="aide-badge" style="background:var(--gold);color:#fff">Aujourd'hui</span>, carte en or, badge doré dans le menu</li>
        <li><span class="aide-badge orange">Demain</span>, préavis 24h</li>
        <li><span class="aide-badge" style="background:var(--beige);color:var(--text-mid)">Dans X jours</span>, à venir cette semaine</li>
      </ul>
      <p style="margin-top:.75rem">Cliquez <strong>"Générer alertes anniversaires"</strong> pour créer des notifications dans la page Alertes. Le badge <i class="bi bi-balloon-heart-fill" style="color:var(--gold)"></i> dans le menu s'allume automatiquement la veille et le jour même.</p>
    </div>

    <!-- CATALOGUE MÉDICAMENTS -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-list-ul"></i> Catalogue des médicaments</div>
      <img src="src/composants/05-alertes-medicaments.png" alt="Alertes médicaments" class="aide-illus">
      <p>Dans la page <strong>Traitements</strong>, le bouton <strong>Médicaments</strong> ouvre le catalogue complet :</p>
      <ul class="aide-list">
        <li><strong>Tous les rôles</strong> peuvent ajouter et modifier des médicaments</li>
        <li><strong>Super Admin seulement</strong> peut supprimer un médicament</li>
        <li>La recherche fonctionne sur le nom commercial, générique et la classe</li>
        <li>Les médicaments du catalogue sont proposés en autocomplétion dans les formulaires de traitement</li>
      </ul>
    </div>

    <!-- SAISIR UNE CONSULTATION -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-journal-plus"></i> Saisir une consultation</div>
      <img src="src/composants/12-consultations.png" alt="Consultations" class="aide-illus">
      <ol class="aide-steps">
        <li>Ouvrez le dossier du résident → bouton <strong>Consultation</strong><br><em>OU</em> page Consultations → <strong>Nouvelle consultation</strong></li>
        <li>Sélectionnez le résident, la date/heure, le médecin</li>
        <li>Remplissez : motif, observations, diagnostic, signes vitaux<br>La <strong>taille est pré-remplie</strong> automatiquement depuis le profil</li>
        <li>Joignez l'ordonnance si disponible (PDF, JPG, PNG, max 5 Mo)</li>
        <li>Cliquez sur <strong>Enregistrer</strong></li>
      </ol>
    </div>

    <!-- AJOUTER UN TRAITEMENT -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-capsule-pill"></i> Ajouter un traitement</div>
      <img src="src/composants/07-planification-visites.png" alt="Planification" class="aide-illus">
      <ol class="aide-steps">
        <li>Dossier du résident → onglet <strong>Traitements</strong> → <strong>Ajouter traitement</strong><br><em>OU</em> page Traitements → <strong>Ajouter traitement</strong></li>
        <li>Tapez le nom du médicament (recherche dans le catalogue ou saisie libre)</li>
        <li>Renseignez dosage, posologie, date de début et durée (jours)</li>
        <li>Cochez <strong>"Traitement chronique"</strong> si le médicament est permanent</li>
        <li>Enregistrez, l'alerte se déclenche automatiquement 24h avant la fin</li>
      </ol>
    </div>

    <!-- CRÉER UN RDV -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-calendar-plus-fill"></i> Créer un rendez-vous</div>
      <img src="src/composants/13-rendez-vous.png" alt="Rendez-vous" class="aide-illus">
      <ol class="aide-steps">
        <li>Page <strong>Rendez-vous</strong> → <strong>Nouveau RDV</strong></li>
        <li>Sélectionnez résident, médecin, date/heure, motif</li>
        <li>Cochez <strong>Urgence</strong> si la situation est critique, le RDV apparaîtra en rouge</li>
        <li>Pour marquer un RDV effectué : ouvrez-le → changer le statut en <em>Effectué</em></li>
      </ol>
    </div>

    <!-- ALERTES -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-bell-fill"></i> Gérer les alertes</div>
      <img src="src/composants/05-alertes-medicaments.png" alt="Alertes médicaments" class="aide-illus">
      <p>La page <strong>Alertes</strong> centralise toutes les notifications :</p>
      <ul class="aide-list">
        <li><span class="aide-badge red">Médicament &lt; 24h</span>, expire dans moins d'un jour</li>
        <li><span class="aide-badge orange">Médicament &lt; 3j</span>, expire bientôt</li>
        <li><span class="aide-badge orange">Non vu 30j+</span>, résident sans consultation depuis plus d'un mois</li>
        <li><span class="aide-badge" style="background:var(--gold);color:#fff"><i class="bi bi-balloon-heart-fill"></i> Anniversaire</span>, anniversaire aujourd'hui ou demain</li>
        <li><span class="aide-badge red">Urgence</span>, marquée manuellement</li>
      </ul>
      <p style="margin-top:.75rem">Cliquez <strong>"Générer alertes"</strong> chaque matin pour actualiser. Les badges dans le menu se mettent à jour automatiquement toutes les 60 secondes.</p>
    </div>

    <!-- EXPORT PDF -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-file-earmark-pdf-fill"></i> Exporter en PDF</div>
      <img src="src/composants/14-statistiques-rapports.png" alt="Statistiques & Rapports" class="aide-illus">
      <p>Depuis le dossier d'un résident, le bouton <strong>PDF</strong> génère un document <strong>complet</strong> adapté au statut du résident :</p>
      <div class="aide-col3" style="margin:.6rem 0">
        <div style="padding:.6rem .8rem;background:rgba(18,72,72,.07);border-radius:var(--radius-sm);border-top:3px solid var(--teal-dark)">
          <div style="font-weight:700;font-size:.82rem;color:var(--teal-dark);margin-bottom:.2rem">Dossier médical</div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Résidents actifs, informations complètes + traitements en cours + 5 dernières consultations + historique vacances + historique courses</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(153,27,27,.06);border-radius:var(--radius-sm);border-top:3px solid #991b1b">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-red-fg);margin-bottom:.2rem">✝ Dossier de Décès</div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">En-tête rouge, date et cause de décès + historique complet (10 consultations) + historique vacances + courses</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(107,114,128,.07);border-radius:var(--radius-sm);border-top:3px solid #6b7280">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-gray-fg);margin-bottom:.2rem"><i class="bi bi-door-open-fill"></i> Dossier Archivé</div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">En-tête gris, date de départ + historique traitements + consultations + vacances + courses</p>
        </div>
      </div>
      <div class="aide-tip" style="margin-top:.5rem"><i class="bi bi-person-fill"></i> <strong>Pied de page :</strong> chaque page du PDF indique en bas <em>"Exporté par : Prénom Nom (email)"</em>, nom et email de la personne connectée qui a généré le document, ainsi que la date de génération.</div>
      <p style="margin-top:.5rem;font-size:.82rem;color:var(--text-light)">Nom du fichier : <code>nom_prenom_[dossier_medical|deces|archive]_St_Hughs.pdf</code></p>
    </div>

    <!-- ★ SYSTÈME DE POINTS ★ -->
    <div class="aide-card aide-card-full aide-card-featured">
      <div class="aide-card-title"><i class="bi bi-graph-up-arrow"></i> Le système de points, comment ça fonctionne ?</div>
      <p class="aide-intro">Chaque résident reçoit automatiquement un <strong>score de priorité</strong> calculé par la base de données. Ce score répond à une seule question : <em>qui doit voir le médecin en premier lors de la prochaine visite ?</em></p>
      <p>Le score est la <strong>somme de 3 facteurs indépendants</strong> :</p>
      <div class="score-explainer">
        <div class="score-factor">
          <div class="score-factor-head" style="background:rgba(37,99,235,.1);border-left:4px solid #2563eb">
            <span class="score-factor-letter" style="background:#2563eb">A</span>
            <strong>Jours sans consultation</strong>
            <span class="score-factor-max">max +80 pts</span>
          </div>
          <table class="score-table">
            <tr><td class="score-pts high">+80</td><td>Résident <strong>jamais vu</strong> par un médecin depuis son entrée</td></tr>
            <tr><td class="score-pts high">+60</td><td>Pas vu depuis <strong>plus de 30 jours</strong></td></tr>
            <tr><td class="score-pts mid">+35</td><td>Pas vu depuis <strong>plus de 21 jours</strong></td></tr>
            <tr><td class="score-pts low">+15</td><td>Pas vu depuis <strong>plus de 14 jours</strong></td></tr>
            <tr><td class="score-pts none">0</td><td>Vu il y a moins de 14 jours</td></tr>
          </table>
        </div>
        <div class="score-factor">
          <div class="score-factor-head" style="background:rgba(220,38,38,.08);border-left:4px solid #dc2626">
            <span class="score-factor-letter" style="background:#dc2626">B</span>
            <strong>Médicaments urgents</strong>
            <span class="score-factor-max">max +50 pts</span>
          </div>
          <table class="score-table">
            <tr><td class="score-pts high">+50</td><td>Un médicament expire dans <strong>moins de 24 heures</strong></td></tr>
            <tr><td class="score-pts mid">+25</td><td>Un médicament expire dans <strong>moins de 3 jours</strong></td></tr>
            <tr><td class="score-pts none">0</td><td>Aucune urgence médicament</td></tr>
          </table>
          <div class="aide-tip"><i class="bi bi-exclamation-triangle-fill"></i> Si plusieurs médicaments sont urgents, seul le plus critique est compté.</div>
        </div>
        <div class="score-factor">
          <div class="score-factor-head" style="background:rgba(184,150,62,.1);border-left:4px solid var(--gold)">
            <span class="score-factor-letter" style="background:var(--gold)">C</span>
            <strong>Priorité manuelle</strong>
            <span class="score-factor-max">max +40 pts</span>
          </div>
          <table class="score-table">
            <tr><td class="score-pts high">+40</td><td>Priorité <strong>P1, Urgente</strong> (réglée dans le profil du résident)</td></tr>
            <tr><td class="score-pts mid">+20</td><td>Priorité <strong>P2, Élevée</strong></td></tr>
            <tr><td class="score-pts none">0</td><td>Priorité <strong>P3, Normale</strong></td></tr>
          </table>
        </div>
      </div>
      <div class="score-bar-legend">
        <div class="score-color-item"><span class="score-color-dot" style="background:#16a34a"></span>Vert, score &lt; 30 → situation normale</div>
        <div class="score-color-item"><span class="score-color-dot" style="background:#d97706"></span>Orange, score 30 à 60 → à surveiller</div>
        <div class="score-color-item"><span class="score-color-dot" style="background:#dc2626"></span>Rouge, score &gt; 60 → à voir en priorité</div>
      </div>
      <div class="score-examples">
        <div class="aide-card-title" style="margin-bottom:1rem"><i class="bi bi-calculator"></i> Exemples</div>
        <div class="score-example-row">
          <div class="score-example-card high">
            <div class="score-example-name">Mme Dupont</div>
            <div class="score-example-detail">Jamais vue depuis son entrée</div>
            <div class="score-example-detail">Médicament expire demain</div>
            <div class="score-example-detail">Priorité P1</div>
            <div class="score-example-calc">80 + 50 + 40 = <strong>170 pts</strong></div>
            <div class="score-example-bar" style="background:#dc2626;width:100%"></div>
          </div>
          <div class="score-example-card mid">
            <div class="score-example-name">M. Ramdin</div>
            <div class="score-example-detail">Pas vu depuis 35 jours</div>
            <div class="score-example-detail">Aucun problème médicament</div>
            <div class="score-example-detail">Priorité P3</div>
            <div class="score-example-calc">60 + 0 + 0 = <strong>60 pts</strong></div>
            <div class="score-example-bar" style="background:#d97706;width:60%"></div>
          </div>
          <div class="score-example-card low">
            <div class="score-example-name">Mme Bheenick</div>
            <div class="score-example-detail">Vue la semaine dernière</div>
            <div class="score-example-detail">Traitement chronique OK</div>
            <div class="score-example-detail">Priorité P3</div>
            <div class="score-example-calc">0 + 0 + 0 = <strong>0 pt</strong></div>
            <div class="score-example-bar" style="background:#16a34a;width:5%"></div>
          </div>
        </div>
      </div>
      <div class="aide-tip" style="margin-top:1rem">
        <i class="bi bi-lightbulb-fill"></i>
        La page <strong>Planification</strong> trie automatiquement les résidents par ce score. Le système s'adapte si le nombre de résidents augmente (64 → 80 → 100…).
      </div>
    </div>

    <!-- DROITS -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-person-lock"></i> Ce que vous pouvez faire</div>
      <div class="aide-col2">
        <div>
          <div style="font-size:.82rem;font-weight:700;text-transform:uppercase;color:var(--teal-dark);margin-bottom:.5rem">✓ Autorisé (Admin)</div>
          <ul class="aide-list">
            <li>Voir tous les dossiers résidents et médecins</li>
            <li>Ajouter / modifier des consultations</li>
            <li>Ajouter / modifier des traitements</li>
            <li>Ajouter / modifier des médecins</li>
            <li>Créer des rendez-vous</li>
            <li>Ajouter / modifier des médicaments dans le catalogue</li>
            <li>Enregistrer les visites de familles</li>
            <li>Enregistrer une <strong>sortie vacances</strong> (temporaire)</li>
            <li>Retour au foyer après vacances</li>
            <li>Enregistrer les sorties <strong>courses</strong> (résidents autonomes)</li>
            <li>Marquer des alertes comme lues</li>
            <li>Générer des alertes anniversaires</li>
            <li>Exporter les dossiers en PDF</li>
          </ul>
        </div>
        <div>
          <div style="font-size:.82rem;font-weight:700;text-transform:uppercase;color:#dc2626;margin-bottom:.5rem">✗ Réservé au Super Admin</div>
          <ul class="aide-list">
            <li>Ajouter / supprimer des résidents</li>
            <li>Supprimer des médecins</li>
            <li>Modifier les contacts famille</li>
            <li>Supprimer des consultations ou traitements</li>
            <li>Supprimer des médicaments du catalogue</li>
            <li>Gérer les slots de planification</li>
            <li>Enregistrer un <strong>départ définitif</strong> <i class="bi bi-door-open-fill"></i></li>
            <li>Enregistrer un <strong>décès</strong> ✝</li>
            <li>Supprimer des sorties courses</li>
            <li>Créer des comptes utilisateurs (menu Administration)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- MON PROFIL -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-person-circle"></i> Mon profil & Déconnexion</div>
      <img src="src/composants/15-mon-profil-deconnexion.png" alt="Mon profil" class="aide-illus">
      <p>Cliquez sur votre <strong>nom en haut à droite</strong> pour accéder à votre profil. Vous y trouverez :</p>
      <ul class="aide-list">
        <li>Votre nom complet</li>
        <li>Votre adresse email</li>
        <li>Votre rôle (Admin ou Super Admin)</li>
        <li>Le bouton <strong>Se déconnecter</strong></li>
      </ul>
      <div class="aide-tip"><i class="bi bi-info-circle-fill"></i> Le profil est en <strong>lecture seule</strong>, pour modifier vos informations, contactez votre Super Admin.</div>
    </div>

    <!-- SUPPORT -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-headset"></i> Support</div>
      <img src="src/composants/16-support.png" alt="Support" class="aide-illus">
      <p>En cas de problème ou de question sur l'utilisation de l'application :</p>
      <ul class="aide-list">
        <li>Contactez votre <strong>Super Admin</strong></li>
        <li>Pour les problèmes de compte (mot de passe oublié, accès refusé), signalez-le à l'administrateur système</li>
        <li>Pour les problèmes techniques graves (application inaccessible, données manquantes), contactez le responsable IT de l'établissement</li>
      </ul>
    </div>

    ${isSuperAdmin() ? `
    <!-- ADMINISTRATION - visible Super Admin uniquement -->
    <div class="aide-card aide-card-full">
      <div class="aide-card-title"><i class="bi bi-shield-check-fill"></i> Administration (réservé au Super Admin)</div>
      <p>Le menu <strong>Administration</strong> de la barre latérale (visible uniquement avec votre rôle) regroupe la <strong>gestion des comptes utilisateurs</strong> et le <strong>journal d'activité</strong>. L'ancien panneau séparé « Gestion Panel » est désormais intégré ici : plus rien à ouvrir dans un autre onglet.</p>
      <div class="aide-col3">
        <div style="padding:.7rem .9rem;background:rgba(22,163,74,.06);border-radius:var(--radius-sm);border-left:3px solid #16a34a">
          <div style="font-weight:700;font-size:.85rem;color:var(--tint-green-fg);margin-bottom:.3rem"><i class="bi bi-person-plus-fill"></i> Créer un compte</div>
          <ol class="aide-steps" style="font-size:.8rem;margin:0">
            <li>Onglet <strong>Utilisateurs</strong> puis <strong>Nouvel utilisateur</strong></li>
            <li>Prénom, nom, email, téléphone, poste</li>
            <li>Choisir le rôle : Admin, Réceptionniste ou Super Admin</li>
            <li>Mot de passe temporaire (min. 8 caractères)</li>
            <li>Enregistrer : la personne peut se connecter aussitôt</li>
          </ol>
        </div>
        <div style="padding:.7rem .9rem;background:rgba(217,119,6,.07);border-radius:var(--radius-sm);border-left:3px solid #d97706">
          <div style="font-weight:700;font-size:.85rem;color:var(--tint-amber-fg);margin-bottom:.3rem"><i class="bi bi-pencil-fill"></i> Modifier / Désactiver</div>
          <ul class="aide-list" style="font-size:.8rem;margin:0">
            <li>Modifiable : prénom, nom, téléphone, poste, <strong>rôle</strong> (l'email jamais)</li>
            <li><strong>Désactiver</strong> (recommandé) : bloque l'accès sans rien effacer, réactivable</li>
            <li><strong>Supprimer</strong> : retire le compte de l'application ; le compte Supabase Auth demeure côté serveur</li>
            <li>Votre propre compte ne peut être ni désactivé ni supprimé depuis le panel</li>
          </ul>
        </div>
        <div style="padding:.7rem .9rem;background:rgba(37,99,235,.06);border-radius:var(--radius-sm);border-left:3px solid #2563eb">
          <div style="font-weight:700;font-size:.85rem;color:var(--tint-blue-fg);margin-bottom:.3rem"><i class="bi bi-journal-text"></i> Journal d'activité</div>
          <ul class="aide-list" style="font-size:.8rem;margin:0">
            <li>Chaque création, modification, suppression est tracée, ainsi que les connexions et exports</li>
            <li>Filtres par utilisateur, table, action et période</li>
            <li>Cliquer sur une ligne : détail champ par champ (avant / après)</li>
            <li><strong>Export CSV</strong> du journal filtré (bouton à côté de Filtrer)</li>
          </ul>
        </div>
      </div>
      <div class="aide-tip" style="margin-top:.75rem"><i class="bi bi-people-fill"></i> <strong>Rôles :</strong> <strong>Admin</strong> = infirmières, personnel soignant (volet médical complet, pas de gestion des résidents ni des comptes). <strong>Réceptionniste</strong> = accueil (identité, contacts, visites, sorties, courses, anniversaires ; jamais le volet médical). <strong>Super Admin</strong> = direction / IT (tout, plus ce menu Administration).</div>
      <div class="aide-tip" style="margin-top:.5rem"><i class="bi bi-lock-fill"></i> Le journal est en <strong>lecture seule</strong> (append-only) : il ne peut être ni modifié ni effacé, même par un Super Admin. Ces restrictions sont appliquées par la base elle-même (RLS et triggers PostgreSQL), pas seulement par l'interface.</div>
    </div>` : ''}

  </div>
</div>`; }

/* ── CONTENU ANGLAIS ──────────────────────────────────────── */
function _en() { return `
<div class="aide-wrap">

  <div class="aide-hero">
    <i class="bi bi-heart-pulse-fill"></i>
    <div>
      <h2>User Guide</h2>
      <p>St Hugh's Anglican Home, Medical Management System</p>
    </div>
  </div>

  <div class="aide-grid">

    <!-- VIDEO GUIDE -->
    <div class="aide-card aide-card-full">
      <div class="aide-card-title"><i class="bi bi-play-circle-fill"></i> Video guide</div>
      <p>Watch this animated presentation to discover the main features of the St Hugh's Medical application in just a few minutes.</p>
      <div class="aide-video-wrap">
        <iframe
          src="Vid%C3%A9o/vid%C3%A9o.html"
          class="aide-video"
          title="St Hugh's Medical Video Guide"
          loading="lazy"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <!-- LOGIN -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-shield-lock-fill"></i> Login</div>
      <img src="src/composants/01-connexion.png" alt="Login" class="aide-illus">
      <p>Enter your <strong>email address</strong> and <strong>password</strong> provided by your administrator. If you forgot your password, contact the system administrator.</p>
      <div class="aide-tip"><i class="bi bi-info-circle-fill"></i> Your session stays active after closing the tab. Always log out if you are using a shared computer.</div>
    </div>

    <!-- NAVIGATION -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-grid-1x2-fill"></i> Navigation</div>
      <img src="src/composants/02-navigation.png" alt="Navigation" class="aide-illus">
      <p>The left menu gives access to all sections. On mobile, tap the ☰ icon at the top left.</p>
      <table class="aide-table">
        <tr><td><i class="bi bi-grid-1x2-fill"></i></td><td><strong>Dashboard</strong></td><td>Overview + today's urgent cases</td></tr>
        <tr><td><i class="bi bi-people-fill"></i></td><td><strong>Residents</strong></td><td>Resident files</td></tr>
        <tr><td><i class="bi bi-person-badge-fill"></i></td><td><strong>Doctors</strong></td><td>Attending physicians</td></tr>
        <tr><td><i class="bi bi-capsule-pill"></i></td><td><strong>Treatments</strong></td><td>Medications, alerts & catalogue</td></tr>
        <tr><td><i class="bi bi-journal-medical"></i></td><td><strong>Consultations</strong></td><td>Visit history</td></tr>
        <tr><td><i class="bi bi-calendar3"></i></td><td><strong>Appointments</strong></td><td>Calendar + emergency slots</td></tr>
        <tr><td><i class="bi bi-list-ol"></i></td><td><strong>Planning</strong></td><td>Medical visit rotation 2×/week</td></tr>
        <tr><td><i class="bi bi-person-walking"></i></td><td><strong>Visits</strong></td><td>Family and friends visits (logging, tracking)</td></tr>
        <tr><td><i class="bi bi-box-arrow-right"></i></td><td><strong>Exits</strong></td><td>Archive of temporary leave, departures and deaths</td></tr>
        <tr><td><i class="bi bi-bag-fill"></i></td><td><strong>Shopping</strong></td><td>Errand outings for independent residents, departure/return times, items purchased</td></tr>
        <tr><td><i class="bi bi-balloon-heart-fill"></i></td><td><strong>Birthdays</strong></td><td>Resident celebrations, automatic alerts</td></tr>
        <tr><td><i class="bi bi-bell-fill"></i></td><td><strong>Alerts</strong></td><td>Medication / birthday notifications</td></tr>
        <tr><td><i class="bi bi-bar-chart-fill"></i></td><td><strong>Statistics</strong></td><td>Activity charts</td></tr>
        <tr><td><i class="bi bi-person-circle"></i></td><td><strong>My profile</strong></td><td>Your account information, logout button</td></tr>
      </table>
    </div>

    <!-- RESIDENT FILE -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-person-vcard-fill"></i> Resident file</div>
      <img src="src/composants/03-dossier-resident.png" alt="Resident file" class="aide-illus">
      <p>From the <strong>Residents</strong> page, click any row to open the full file. It has 5 tabs:</p>
      <div class="aide-tabs-preview">
        <div class="aide-tab-item"><strong>Info</strong><span>Attending doctor, blood type, height, mobility, allergies, medical history, plus vacation history and shopping history at the bottom if available</span></div>
        <div class="aide-tab-item"><strong>Contacts</strong><span>Family emergency contacts, the primary contact is highlighted</span></div>
        <div class="aide-tab-item"><strong>Treatments</strong><span>Active medications with days remaining and colour-coded alerts</span></div>
        <div class="aide-tab-item"><strong>Consultations</strong><span>Medical visit history with links to prescriptions</span></div>
        <div class="aide-tab-item"><strong>Appointments</strong><span>Past and upcoming appointments for this resident</span></div>
      </div>
      <div class="aide-tip" style="margin-top:.75rem"><i class="bi bi-luggage-fill"></i> <strong>Vacation history:</strong> each past vacation stay (departure date, actual return date, reason) is automatically saved and appears in the Info tab when the resident returns.</div>
      <div class="aide-tip" style="margin-top:.5rem"><i class="bi bi-bag-fill"></i> <strong>Shopping history:</strong> all logged shopping trips for this resident (date, departure/return time, items purchased) are visible in the Info tab, for independent residents only.</div>
    </div>

    <!-- SHOPPING -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-bag-fill"></i> Shopping Trips</div>
      <img src="src/composants/04-courses-commissions.png" alt="Shopping Trips" class="aide-illus">
      <p>The <strong>Shopping</strong> page is for <strong>independent residents</strong> only (<em>mobility = Autonomous</em>). It records each outing for errands.</p>
      <ol class="aide-steps">
        <li>Click <strong>Log an outing</strong></li>
        <li>Select the independent resident (only active residents with "Autonomous" mobility appear)</li>
        <li>Enter the date, departure time and items to buy (optional)</li>
        <li>Click <strong>Save</strong></li>
      </ol>
      <p style="margin-top:.5rem">When the resident returns:</p>
      <ol class="aide-steps" start="5">
        <li>Click <strong>Return</strong> next to their trip</li>
        <li>Confirm the return time (pre-filled with the current time)</li>
      </ol>
      <div class="aide-col3">
        <div style="padding:.6rem .8rem;background:rgba(37,99,235,.06);border-radius:var(--radius-sm);border-left:3px solid #2563eb">
          <div style="font-weight:700;font-size:.82rem;color:var(--teal-dark);margin-bottom:.2rem"><span class="badge badge-teal">Planned</span></div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Trip logged, departure time not yet set</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(245,158,11,.07);border-radius:var(--radius-sm);border-left:3px solid #f59e0b">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-amber-fg);margin-bottom:.2rem"><span class="badge badge-attente">Out</span></div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Resident is out, not yet returned</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(22,163,74,.06);border-radius:var(--radius-sm);border-left:3px solid #16a34a">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-green-fg);margin-bottom:.2rem"><span class="badge badge-actif">Returned</span></div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Resident is back, trip complete</p>
        </div>
      </div>
      <div class="aide-tip">
        <i class="bi bi-info-circle-fill"></i> The full shopping history is also visible in the resident's <strong>file</strong> (Info tab) and in the <strong>PDF export</strong>.
      </div>
    </div>

    <!-- EXITS / DEATHS -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-box-arrow-right"></i> Exits</div>
      <img src="src/composants/09-sorties-deces.png" alt="Exits" class="aide-illus">
      <p>From an <strong>active resident file</strong>, the exit button records one of 3 situations:</p>
      <div class="aide-col3-lg">
        <div style="padding:.75rem;background:rgba(37,99,235,.06);border-radius:var(--radius-sm);border-left:3px solid #2563eb">
          <div style="font-weight:700;color:var(--tint-blue-fg);margin-bottom:.3rem"><i class="bi bi-luggage-fill"></i> Vacation / Temporary leave</div>
          <p style="font-size:.82rem;margin:0">The resident will return. They stay <strong>active</strong> with the "On leave" badge. Use <strong>Return to home</strong> when they come back. <em>All roles.</em></p>
        </div>
        <div style="padding:.75rem;background:rgba(107,114,128,.08);border-radius:var(--radius-sm);border-left:3px solid #6b7280">
          <div style="font-weight:700;color:var(--tint-gray-fg);margin-bottom:.3rem"><i class="bi bi-door-open-fill"></i> Permanent departure</div>
          <p style="font-size:.82rem;margin:0">Family takes the resident home. They become <strong>archived</strong>, visible in the "Departed" filter. <em>Super Admin only.</em></p>
        </div>
        <div style="padding:.75rem;background:rgba(153,27,27,.06);border-radius:var(--radius-sm);border-left:3px solid #991b1b">
          <div style="font-weight:700;color:var(--tint-red-fg);margin-bottom:.3rem"><span style="font-size:1rem">✝</span> Death</div>
          <p style="font-size:.82rem;margin:0">The resident is moved to the "Deceased" archive. All data is preserved. Cause of death is optional. <em>Super Admin only.</em></p>
        </div>
      </div>
      <div class="aide-tip" style="margin-bottom:.6rem"><i class="bi bi-lock-fill"></i> <strong>Archived profile (deceased or departed):</strong> The file becomes read-only, no new consultations, treatments or appointments possible. The PDF export is adapted to show the relevant archived information.</div>
      <div class="aide-tip" style="margin-bottom:.6rem">
        <i class="bi bi-luggage-fill"></i> <strong>Return from leave:</strong> when you click <em>Return to home</em>, the vacation period (departure date, actual return date, reason) is automatically saved in the resident's history.
      </div>
      <div class="aide-tip"><i class="bi bi-info-circle-fill"></i> Residents on vacation remain in the main list with a blue badge. Deceased and departed residents only appear in the <strong>Exits</strong> page and their dedicated filters.</div>
    </div>

    <!-- VISITS -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-person-walking"></i> Visits</div>
      <img src="src/composants/08-visites-familles.png" alt="Family visits" class="aide-illus">
      <p>The <strong>Visits</strong> page manages all family and friends visits:</p>
      <ol class="aide-steps">
        <li>Click <strong>Log a visit</strong></li>
        <li>Enter the main visitor: first name, last name, phone, relation (optional)</li>
        <li>Select the resident being visited and enter the number of people</li>
        <li>If more than 1 person, add names of other visitors (only one phone number needed)</li>
        <li>Set the date and arrival time, check <strong>Schedule</strong> for a future visit</li>
        <li>Departure time can be set later by clicking <strong>End visit</strong></li>
      </ol>
      <p style="margin-top:.5rem">Statuses: <span class="badge badge-planifie">Scheduled</span> → <span class="badge" style="background:var(--tint-green-bg);color:var(--tint-green-fg)">In progress</span> → <span class="badge badge-confirme">Completed</span>. The menu badge shows today's visit count.</p>
      <div class="aide-tip" style="margin-top:.75rem">
        <i class="bi bi-list-ol"></i> <strong>Planning:</strong> the <strong>Planning</strong> page manages the medical visit rotation (2×/week). Residents are sorted by priority score to optimise each doctor visit.
      </div>
    </div>

    <!-- BIRTHDAYS -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-balloon-heart-fill"></i> Birthdays</div>
      <img src="src/composants/06-anniversaires.png" alt="Birthdays" class="aide-illus">
      <p>The <strong>Birthdays</strong> page displays resident birthdays sorted by urgency:</p>
      <ul class="aide-list">
        <li><span class="aide-badge" style="background:var(--gold);color:#fff">Today</span>, gold card, golden badge in the menu</li>
        <li><span class="aide-badge orange">Tomorrow</span>, 24h advance notice</li>
        <li><span class="aide-badge" style="background:var(--beige);color:var(--text-mid)">In X days</span>, upcoming this week</li>
      </ul>
      <p style="margin-top:.75rem">Click <strong>"Generate birthday alerts"</strong> to create notifications in the Alerts page. The <i class="bi bi-balloon-heart-fill" style="color:var(--gold)"></i> badge in the menu lights up automatically the day before and on the day.</p>
    </div>

    <!-- MEDICATION CATALOGUE -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-list-ul"></i> Medication catalogue</div>
      <img src="src/composants/05-alertes-medicaments.png" alt="Medication alerts" class="aide-illus">
      <p>In the <strong>Treatments</strong> page, the <strong>Medications</strong> button opens the full catalogue:</p>
      <ul class="aide-list">
        <li><strong>All roles</strong> can add and edit medications</li>
        <li><strong>Super Admin only</strong> can delete a medication</li>
        <li>Search works on trade name, generic name and class</li>
        <li>Catalogue medications are suggested as autocomplete when creating treatments</li>
      </ul>
    </div>

    <!-- RECORD A CONSULTATION -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-journal-plus"></i> Record a consultation</div>
      <img src="src/composants/12-consultations.png" alt="Consultations" class="aide-illus">
      <ol class="aide-steps">
        <li>Open the resident file → <strong>Consultation</strong> button<br><em>OR</em> Consultations page → <strong>New consultation</strong></li>
        <li>Select the resident, date/time and doctor</li>
        <li>Fill in: reason, observations, diagnosis, vital signs<br>The <strong>height is pre-filled</strong> automatically from the profile</li>
        <li>Attach the prescription if available (PDF, JPG, PNG, max 5 MB)</li>
        <li>Click <strong>Save</strong></li>
      </ol>
    </div>

    <!-- ADD A TREATMENT -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-capsule-pill"></i> Add a treatment</div>
      <img src="src/composants/07-planification-visites.png" alt="Planning" class="aide-illus">
      <ol class="aide-steps">
        <li>Resident file → <strong>Treatments</strong> tab → <strong>Add treatment</strong><br><em>OR</em> Treatments page → <strong>Add treatment</strong></li>
        <li>Type the medication name (search catalogue or free entry)</li>
        <li>Fill in dosage, schedule, start date and duration (days)</li>
        <li>Check <strong>"Chronic treatment"</strong> if the medication is permanent</li>
        <li>Save, an alert fires automatically 24h before the end date</li>
      </ol>
    </div>

    <!-- CREATE AN APPOINTMENT -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-calendar-plus-fill"></i> Create an appointment</div>
      <img src="src/composants/13-rendez-vous.png" alt="Appointments" class="aide-illus">
      <ol class="aide-steps">
        <li><strong>Appointments</strong> page → <strong>New appointment</strong></li>
        <li>Select resident, doctor, date/time and reason</li>
        <li>Check <strong>Emergency</strong> if the situation is critical, the appointment will appear in red</li>
        <li>To mark an appointment as done: open it → change status to <em>Completed</em></li>
      </ol>
    </div>

    <!-- ALERTS -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-bell-fill"></i> Managing alerts</div>
      <img src="src/composants/05-alertes-medicaments.png" alt="Medication alerts" class="aide-illus">
      <p>The <strong>Alerts</strong> page gathers all notifications:</p>
      <ul class="aide-list">
        <li><span class="aide-badge red">Medication &lt; 24h</span>, expires within one day</li>
        <li><span class="aide-badge orange">Medication &lt; 3d</span>, expiring soon</li>
        <li><span class="aide-badge orange">Not seen 30d+</span>, no consultation for over a month</li>
        <li><span class="aide-badge" style="background:var(--gold);color:#fff"><i class="bi bi-balloon-heart-fill"></i> Birthday</span>, birthday today or tomorrow</li>
        <li><span class="aide-badge red">Emergency</span>, manually flagged</li>
      </ul>
      <p style="margin-top:.75rem">Click <strong>"Generate alerts"</strong> every morning to refresh. Menu badges update automatically every 60 seconds.</p>
    </div>

    <!-- PDF EXPORT -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-file-earmark-pdf-fill"></i> Export to PDF</div>
      <img src="src/composants/14-statistiques-rapports.png" alt="Statistics & Reports" class="aide-illus">
      <p>From a resident file, the <strong>PDF</strong> button generates a <strong>complete</strong> document adapted to the resident's status:</p>
      <div class="aide-col3" style="margin:.6rem 0">
        <div style="padding:.6rem .8rem;background:rgba(18,72,72,.07);border-radius:var(--radius-sm);border-top:3px solid var(--teal-dark)">
          <div style="font-weight:700;font-size:.82rem;color:var(--teal-dark);margin-bottom:.2rem">Medical file</div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Active residents, full info + current treatments + last 5 consultations + vacation history + shopping history</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(153,27,27,.06);border-radius:var(--radius-sm);border-top:3px solid #991b1b">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-red-fg);margin-bottom:.2rem">✝ Death Record</div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Red header, date & cause of death + full history (10 consultations) + vacation history + shopping history</p>
        </div>
        <div style="padding:.6rem .8rem;background:rgba(107,114,128,.07);border-radius:var(--radius-sm);border-top:3px solid #6b7280">
          <div style="font-weight:700;font-size:.82rem;color:var(--tint-gray-fg);margin-bottom:.2rem"><i class="bi bi-door-open-fill"></i> Archived File</div>
          <p style="font-size:.78rem;margin:0;color:var(--text-light)">Grey header, departure date + treatment & consultation history + vacation + shopping</p>
        </div>
      </div>
      <div class="aide-tip" style="margin-top:.5rem"><i class="bi bi-person-fill"></i> <strong>Footer:</strong> every page of the PDF shows <em>"Exported by: First Last (email)"</em>, the name and email of the logged-in user who generated the document, plus the generation date.</div>
      <p style="margin-top:.5rem;font-size:.82rem;color:var(--text-light)">File name: <code>name_firstname_[medical|death|archived]_St_Hughs.pdf</code></p>
    </div>

    <!-- ★ PRIORITY SCORE ★ -->
    <div class="aide-card aide-card-full aide-card-featured">
      <div class="aide-card-title"><i class="bi bi-graph-up-arrow"></i> The priority score system, how does it work?</div>
      <p class="aide-intro">Every resident automatically receives a <strong>priority score</strong> calculated by the database. This score answers one question: <em>who should see the doctor first at the next visit?</em></p>
      <p>The score is the <strong>sum of 3 independent factors</strong>:</p>
      <div class="score-explainer">
        <div class="score-factor">
          <div class="score-factor-head" style="background:rgba(37,99,235,.1);border-left:4px solid #2563eb">
            <span class="score-factor-letter" style="background:#2563eb">A</span>
            <strong>Days without a consultation</strong>
            <span class="score-factor-max">max +80 pts</span>
          </div>
          <table class="score-table">
            <tr><td class="score-pts high">+80</td><td>Resident <strong>never seen</strong> by a doctor since admission</td></tr>
            <tr><td class="score-pts high">+60</td><td>Not seen for <strong>more than 30 days</strong></td></tr>
            <tr><td class="score-pts mid">+35</td><td>Not seen for <strong>more than 21 days</strong></td></tr>
            <tr><td class="score-pts low">+15</td><td>Not seen for <strong>more than 14 days</strong></td></tr>
            <tr><td class="score-pts none">0</td><td>Seen within the last 14 days</td></tr>
          </table>
        </div>
        <div class="score-factor">
          <div class="score-factor-head" style="background:rgba(220,38,38,.08);border-left:4px solid #dc2626">
            <span class="score-factor-letter" style="background:#dc2626">B</span>
            <strong>Urgent medications</strong>
            <span class="score-factor-max">max +50 pts</span>
          </div>
          <table class="score-table">
            <tr><td class="score-pts high">+50</td><td>A medication expires in <strong>less than 24 hours</strong></td></tr>
            <tr><td class="score-pts mid">+25</td><td>A medication expires in <strong>less than 3 days</strong></td></tr>
            <tr><td class="score-pts none">0</td><td>No medication urgency</td></tr>
          </table>
          <div class="aide-tip"><i class="bi bi-exclamation-triangle-fill"></i> If multiple medications are urgent, only the most critical is counted.</div>
        </div>
        <div class="score-factor">
          <div class="score-factor-head" style="background:rgba(184,150,62,.1);border-left:4px solid var(--gold)">
            <span class="score-factor-letter" style="background:var(--gold)">C</span>
            <strong>Manual priority</strong>
            <span class="score-factor-max">max +40 pts</span>
          </div>
          <table class="score-table">
            <tr><td class="score-pts high">+40</td><td>Priority <strong>P1, Urgent</strong> (set in the resident profile)</td></tr>
            <tr><td class="score-pts mid">+20</td><td>Priority <strong>P2, High</strong></td></tr>
            <tr><td class="score-pts none">0</td><td>Priority <strong>P3, Normal</strong></td></tr>
          </table>
        </div>
      </div>
      <div class="score-bar-legend">
        <div class="score-color-item"><span class="score-color-dot" style="background:#16a34a"></span>Green, score &lt; 30 → normal</div>
        <div class="score-color-item"><span class="score-color-dot" style="background:#d97706"></span>Orange, score 30 to 60 → monitor</div>
        <div class="score-color-item"><span class="score-color-dot" style="background:#dc2626"></span>Red, score &gt; 60 → priority case</div>
      </div>
      <div class="score-examples">
        <div class="aide-card-title" style="margin-bottom:1rem"><i class="bi bi-calculator"></i> Examples</div>
        <div class="score-example-row">
          <div class="score-example-card high">
            <div class="score-example-name">Mrs Dupont</div>
            <div class="score-example-detail">Never seen since admission</div>
            <div class="score-example-detail">Medication expires tomorrow</div>
            <div class="score-example-detail">Priority P1</div>
            <div class="score-example-calc">80 + 50 + 40 = <strong>170 pts</strong></div>
            <div class="score-example-bar" style="background:#dc2626;width:100%"></div>
          </div>
          <div class="score-example-card mid">
            <div class="score-example-name">Mr Ramdin</div>
            <div class="score-example-detail">Not seen for 35 days</div>
            <div class="score-example-detail">No medication issues</div>
            <div class="score-example-detail">Priority P3</div>
            <div class="score-example-calc">60 + 0 + 0 = <strong>60 pts</strong></div>
            <div class="score-example-bar" style="background:#d97706;width:60%"></div>
          </div>
          <div class="score-example-card low">
            <div class="score-example-name">Mrs Bheenick</div>
            <div class="score-example-detail">Seen last week</div>
            <div class="score-example-detail">Chronic treatment OK</div>
            <div class="score-example-detail">Priority P3</div>
            <div class="score-example-calc">0 + 0 + 0 = <strong>0 pt</strong></div>
            <div class="score-example-bar" style="background:#16a34a;width:5%"></div>
          </div>
        </div>
      </div>
      <div class="aide-tip" style="margin-top:1rem">
        <i class="bi bi-lightbulb-fill"></i>
        The <strong>Planning</strong> page automatically sorts residents by this score. The system adapts automatically as the number of residents grows (64 → 80 → 100…).
      </div>
    </div>

    <!-- ACCESS RIGHTS -->
    <div class="aide-card aide-card-wide">
      <div class="aide-card-title"><i class="bi bi-person-lock"></i> What you can do</div>
      <div class="aide-col2">
        <div>
          <div style="font-size:.82rem;font-weight:700;text-transform:uppercase;color:var(--teal-dark);margin-bottom:.5rem">✓ Allowed (Admin)</div>
          <ul class="aide-list">
            <li>View all resident and doctor files</li>
            <li>Add / edit consultations</li>
            <li>Add / edit treatments</li>
            <li>Add / edit doctors</li>
            <li>Create appointments</li>
            <li>Add / edit medications in catalogue</li>
            <li>Log family visits</li>
            <li>Record <strong>vacation leave</strong> (temporary)</li>
            <li>Return to home after vacation</li>
            <li>Log <strong>shopping trips</strong> (independent residents)</li>
            <li>Mark alerts as read</li>
            <li>Generate birthday alerts</li>
            <li>Export files to PDF</li>
          </ul>
        </div>
        <div>
          <div style="font-size:.82rem;font-weight:700;text-transform:uppercase;color:#dc2626;margin-bottom:.5rem">✗ Super Admin only</div>
          <ul class="aide-list">
            <li>Add / remove residents</li>
            <li>Delete doctors</li>
            <li>Edit family contacts</li>
            <li>Delete consultations or treatments</li>
            <li>Delete medications from catalogue</li>
            <li>Manage planning slots</li>
            <li>Record a <strong>permanent departure</strong> <i class="bi bi-door-open-fill"></i></li>
            <li>Record a <strong>death</strong> ✝</li>
            <li>Delete shopping trip records</li>
            <li>Create user accounts (Administration menu)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- MY PROFILE -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-person-circle"></i> My profile & Logout</div>
      <img src="src/composants/15-mon-profil-deconnexion.png" alt="My profile" class="aide-illus">
      <p>Click your <strong>name in the top right</strong> to access your profile. You will find:</p>
      <ul class="aide-list">
        <li>Your full name</li>
        <li>Your email address</li>
        <li>Your role (Admin or Super Admin)</li>
        <li>The <strong>Log out</strong> button</li>
      </ul>
      <div class="aide-tip"><i class="bi bi-info-circle-fill"></i> The profile is <strong>read-only</strong>, to change your details, contact your Super Admin.</div>
    </div>

    <!-- SUPPORT -->
    <div class="aide-card">
      <div class="aide-card-title"><i class="bi bi-headset"></i> Support</div>
      <img src="src/composants/16-support.png" alt="Support" class="aide-illus">
      <p>If you have a problem or a question about using the application:</p>
      <ul class="aide-list">
        <li>Contact your <strong>Super Admin</strong></li>
        <li>For account issues (forgotten password, access denied), report it to the system administrator</li>
        <li>For serious technical issues (application inaccessible, missing data), contact the facility's IT manager</li>
      </ul>
    </div>

    ${isSuperAdmin() ? `
    <!-- ADMINISTRATION - Super Admin only -->
    <div class="aide-card aide-card-full">
      <div class="aide-card-title"><i class="bi bi-shield-check-fill"></i> Administration (Super Admin only)</div>
      <p>The <strong>Administration</strong> menu in the sidebar (visible only with your role) gathers <strong>user account management</strong> and the <strong>activity log</strong>. The former separate "Management Panel" is now integrated here: nothing to open in another tab anymore.</p>
      <div class="aide-col3">
        <div style="padding:.7rem .9rem;background:rgba(22,163,74,.06);border-radius:var(--radius-sm);border-left:3px solid #16a34a">
          <div style="font-weight:700;font-size:.85rem;color:var(--tint-green-fg);margin-bottom:.3rem"><i class="bi bi-person-plus-fill"></i> Create an account</div>
          <ol class="aide-steps" style="font-size:.8rem;margin:0">
            <li><strong>Users</strong> tab, then <strong>New user</strong></li>
            <li>First name, last name, email, phone, position</li>
            <li>Choose the role: Admin, Receptionist or Super Admin</li>
            <li>Temporary password (min. 8 characters)</li>
            <li>Save: the person can sign in right away</li>
          </ol>
        </div>
        <div style="padding:.7rem .9rem;background:rgba(217,119,6,.07);border-radius:var(--radius-sm);border-left:3px solid #d97706">
          <div style="font-weight:700;font-size:.85rem;color:var(--tint-amber-fg);margin-bottom:.3rem"><i class="bi bi-pencil-fill"></i> Edit / Deactivate</div>
          <ul class="aide-list" style="font-size:.8rem;margin:0">
            <li>Editable: first name, last name, phone, position, <strong>role</strong> (never the email)</li>
            <li><strong>Deactivate</strong> (recommended): blocks access without erasing anything, reversible</li>
            <li><strong>Delete</strong>: removes the account from the app; the Supabase Auth account remains server-side</li>
            <li>Your own account can be neither deactivated nor deleted from the panel</li>
          </ul>
        </div>
        <div style="padding:.7rem .9rem;background:rgba(37,99,235,.06);border-radius:var(--radius-sm);border-left:3px solid #2563eb">
          <div style="font-weight:700;font-size:.85rem;color:var(--tint-blue-fg);margin-bottom:.3rem"><i class="bi bi-journal-text"></i> Activity log</div>
          <ul class="aide-list" style="font-size:.8rem;margin:0">
            <li>Every creation, edit and deletion is tracked, along with logins and exports</li>
            <li>Filters by user, table, action and period</li>
            <li>Click a row: field-by-field detail (before / after)</li>
            <li><strong>CSV export</strong> of the filtered log (button next to Filter)</li>
          </ul>
        </div>
      </div>
      <div class="aide-tip" style="margin-top:.75rem"><i class="bi bi-people-fill"></i> <strong>Roles:</strong> <strong>Admin</strong> = nurses, care staff (full medical side, no resident or account management). <strong>Receptionist</strong> = front desk (identity, contacts, visits, exits, shopping, birthdays; never the medical side). <strong>Super Admin</strong> = management / IT (everything, plus this Administration menu).</div>
      <div class="aide-tip" style="margin-top:.5rem"><i class="bi bi-lock-fill"></i> The log is <strong>read-only</strong> (append-only): it cannot be edited or erased, even by a Super Admin. These restrictions are enforced by the database itself (RLS and PostgreSQL triggers), not just by the interface.</div>
    </div>` : ''}

  </div>
</div>`; }
