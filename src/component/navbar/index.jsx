import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import "./Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const navigate = useNavigate();

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40); // tu peux ajuster seuil
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowUserInfo(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir vous déconnecter ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, déconnecter",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        Swal.fire({
          icon: "success",
          title: "Déconnexion réussie",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  return (
    <nav className={`navbar ${scrolled ? "shrink" : ""}`}>
      <div className="logo">
        <Link to="/">
          <img src="/images/image/logoegna.png" alt="Logo" className="logo-icon" />
          GESTION ELEVE GENDARME
        </Link>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/">ACCUEIL</Link>
        </li>
        <li>
          <Link to="/eleve">ELEVE</Link>
        </li>
        <li>
          <Link to="/statistique">ASSIDUITE</Link>
        </li>
        <li style={{ position: "relative" }}>
          <button
            ref={buttonRef}
            onClick={() => setShowUserInfo(!showUserInfo)}
            className="btn-logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>

          {showUserInfo && (
            <div
              ref={panelRef}
              className="user-panel"
            >
              <p>
                <strong>Username :</strong> {user?.username}
              </p>

              {user?.type === "superadmin" && (
                <button
                  className="btn btn-secondary w-100 mb-2"
                  onClick={() => navigate("/admin")}
                >
                  ⚙ Paramètres
                </button>
              )}

              <button
                className="btn btn-danger w-100"
                onClick={() => {
                  handleLogout();
                  setShowUserInfo(false);
                }}
              >
                Déconnexion
              </button>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
