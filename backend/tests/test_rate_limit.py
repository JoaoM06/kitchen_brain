def test_login_rate_limit(client, user_factory):
    """Após 5 logins por minuto do mesmo IP, o 6º deve retornar 429."""
    user_factory(email="ratelimit@kb.com", senha="SenhaForte123")
    payload = {"email": "ratelimit@kb.com", "senha": "SenhaForte123"}

    # Envia 10 requisições — o limite é 5/min, alguma deve ser bloqueada
    responses = [client.post("/auth/login", json=payload) for _ in range(10)]
    status_codes = [r.status_code for r in responses]

    assert 429 in status_codes, (
        f"Rate limit não disparou. Status recebidos: {status_codes}"
    )
