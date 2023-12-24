import argparse

def preload(parser: argparse.ArgumentParser):
  parser.add_argument("--local-flows-path", type=str, default="models/LightDiffusionFlow", help="Path to save flow files.")
