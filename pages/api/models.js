import models from '../../models.json';

export default function handler(req, res) {
  res.status(200).json(models);
}
