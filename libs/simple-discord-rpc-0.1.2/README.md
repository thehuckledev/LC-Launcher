## A simple CLI tool for Discord RPC status
![](demo.png)
```txt
Usage: simple-discord-rpc [OPTIONS]

Options:
  -c, --client-id <CLIENT_ID>                
  -s, --state <STATE>                        
  -d, --details <DETAILS>                    
  -K, --large-image-key <LARGE_IMAGE_KEY>    
  -T, --large-image-text <LARGE_IMAGE_TEXT>  
  -k, --small-image-key <SMALL_IMAGE_KEY>    
  -t, --small-image-text <SMALL_IMAGE_TEXT>  
  -h, --help                                 Print help
  -V, --version                              Print version
```

## Installation
- From crates.io
```bash
cargo install simple-discord-rpc
```

- From source
```bash
# have rust build utils installed
git clone https://github.com/DaBigBlob/simple-discord-rpc.git
cd simple-discord-rpc
cargo build --release
./target/release/simple-discord-rpc
# this^ is your binary. rename/relocate as you wish
```