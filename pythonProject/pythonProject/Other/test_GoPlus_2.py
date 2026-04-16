from goplus.token import Token

# set timeout seconds
data = Token(access_token=None).token_security(
    chain_id="56",
    addresses=["0x02f4ff0b6e4f2aee8af704b074913893520c4444"],
    **{"_request_timeout": 10}
)
print(data)
